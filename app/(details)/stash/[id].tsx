import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Provider } from 'react-native-paper'
import RenderHtml, { defaultSystemFonts } from 'react-native-render-html'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SvgFromXml } from 'react-native-svg'
import { WebView } from 'react-native-webview'
import ActionsDropDown from '~/components/ActionDropDown'
import { svgIcons } from '~/components/CustomSvgIcons'
import Header from '~/components/header'
import { NetworkIndicator } from '~/components/NetworkIndicator'
import { useAuth } from '~/contexts/AuthContext'
import { useSaves } from '~/contexts/SavesContext'
import sanitizeHtml from 'sanitize-html'
import { Skeleton } from '~/components/ui'
import { OfflineStorage } from '~/lib/offlineStorage'
import { extractHostname } from '~/lib/utils'
const systemFonts = [...defaultSystemFonts, 'Menlo', 'Courier', 'monospace']



// Article type definition
interface StashArticleDetail {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content?: string;
  featured_image_url: string;
  isArchived: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  source: string;
}

const ReadStashPage = () => {
  const { id } = useLocalSearchParams()
  const { loading: authLoading } = useAuth()
  const { getSaveById, isOnline, markAsRead, markAsUnread, archiveSave, unarchiveSave, deleteSave } = useSaves()

  const [article, setArticle] = useState<StashArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const webviewRef = useRef<WebView | null>(null)
  const extractionTimeoutRef = useRef<number | null>(null)



  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error: fetchError } = await getSaveById(id as string)
      if (fetchError) {
        setError(fetchError)
      } else {
        setArticle(data)
      }
    } catch {
      setError('Failed to load article. Please try again.')
    } finally { setLoading(false) }
  }

  const INJECTED_EXTRACTOR = `
    (function(){
      function loadScript(src, cb){
        var s=document.createElement('script'); s.src=src; s.onload=cb; s.onerror=cb; document.documentElement.appendChild(s);
      }
      function stripDangerous(el){
        // remove script/style/iframe/link/noscript
        var bad = el.querySelectorAll('script,noscript,iframe,link,style');
        bad.forEach(function(n){ n.parentNode && n.parentNode.removeChild(n) });
        // remove inline handlers
        var all = el.getElementsByTagName('*');
        for(var i=0;i<all.length;i++){
          var attrs = all[i].attributes;
          for(var j=attrs.length-1;j>=0;j--){
            if(attrs[j].name && attrs[j].name.toLowerCase().indexOf('on') === 0){
              all[i].removeAttribute(attrs[j].name);
            }
          }
        }
      }
      function sendResult(article){
        try {
          var lead = null;
          var og = document.querySelector('meta[property=\"og:image\"]') || document.querySelector('meta[name=\"twitter:image\"]');
          if(og) lead = og.getAttribute('content');
          var container = document.createElement('div');
          container.innerHTML = article.content || '';
          stripDangerous(container);
          var cleanHTML = container.innerHTML;
          window.ReactNativeWebView.postMessage(JSON.stringify({ok:true, article:{ title: article.title || document.title, content: cleanHTML, byline: article.byline || '', excerpt: article.excerpt || (article.textContent || '').slice(0,200), lead_image_url: article.lead_image_url || lead || null }}));
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ok:false, err: 'post failed: ' + e.message}));
        }
      }
      function tryParse(){
        try{
          if(window.Readability){
            try {
              var doc = document.cloneNode(true);
              var article = new Readability(doc).parse();
              if(article && article.content && article.content.length > 20){
                return sendResult(article);
              }
            } catch(e) { /* swallow, fallthrough to fallback */ }
          }
          // fallback: try to find article/main
          var el = document.querySelector('article') || document.querySelector('main') || document.querySelector('[role=\"article\"]') || document.body;
          var articleFallback = {
            title: document.title,
            content: el ? el.innerHTML : document.body.innerHTML,
            textContent: el ? el.innerText : document.body.innerText,
            excerpt: (el ? (el.innerText||'').slice(0,300) : (document.body.innerText||'').slice(0,300)),
            byline: ''
          };
          return sendResult(articleFallback);
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ok:false, err: e.message}));
        }
      }
      function start(){
        // Try load Readability, but continue with fallback if it doesn't work quickly
        if(window.Readability){
          return tryParse();
        }
        loadScript('https://unpkg.com/@mozilla/readability@0.4.4/Readability.js', function(){
          tryParse();
        });
        // fallback attempt after 2s regardless
        setTimeout(tryParse, 2000);
      }
      if(document.readyState === 'complete' || document.readyState === 'interactive') start();
      else document.addEventListener('DOMContentLoaded', start);
    })();
    true;
    `

  const startExtraction = (url: string) => {
    console.log("Starting Extraction process")
    setExtractError(null)
    setExtracting(true)
    // clear previous timeout
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current)
      extractionTimeoutRef.current = null
    }
    // set a safety timeout (10s)
    extractionTimeoutRef.current = setTimeout(() => {
      setExtracting(false)
      setExtractError('Extraction timed out — site may block extraction or be paywalled.')
    }, 10000) as unknown as number

    // load the URL into the hidden webview (we render it below).
    // just ensure webviewRef.current exists and reloads with new url
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`)
    }
    // Alternatively we mount the WebView with source uri prop tied to article.url.
    // The WebView below will run the injected script on load.
  }

  const onWebViewMessage = useCallback(async (e: any) => {
    if (!e?.nativeEvent?.data) return;
  
    let payload = null;
    try {
      payload = JSON.parse(e.nativeEvent.data);
    } catch (err) {
      setExtracting(false);
      setExtractError('Bad extractor response');
      return;
    }
  
    if (!payload.ok) {
      setExtracting(false);
      setExtractError(payload.err || 'Extraction failed');
      if (extractionTimeoutRef.current) { clearTimeout(extractionTimeoutRef.current); extractionTimeoutRef.current = null; }
      return;
    }
  
    const art = payload.article || {};
    // sanitize HTML content
    const clean = sanitizeHtml(art.content || '', {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption', 'pre', 'code']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height', 'loading'],
        a: ['href', 'name', 'target', 'rel']
      },
      allowedSchemes: ['http', 'https', 'data', 'mailto'],
      transformTags: {
        'a': (tagName, attribs) => ({ tagName: 'a', attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' } })
      }
    });
  
    // Build a valid saveDetail using current article state as fallback where available
    try {
      const saveId = article?.id ?? `offline_${Date.now()}`;
      const saveUrl = article?.url ?? (art.url || '');
      const saveTitle = art.title || article?.title || '';
      const featuredImage = art.lead_image_url || article?.featured_image_url || '';
  
      console.log(article)
      const saveDetail = {
        id: saveId,
        title: saveTitle,
        url: saveUrl,
        excerpt: clean.slice(0, 300),
        featured_image_url: featuredImage,
        isArchived: article?.isArchived ?? false,
        isRead: article?.isRead ?? false,
        createdAt: article?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: clean,
        source: article?.source || extractHostname(saveUrl)
      };
  
      // persist to device storage (may write to file or AsyncStorage depending on your OfflineStorage)
      try {
        await OfflineStorage.cacheSaveDetail(saveDetail);
      } catch (cacheErr) {
        console.error('Failed to cache save detail:', cacheErr);
        // don't block UI if caching fails — still update UI
      }
  
      // update UI. set both excerpt and content so existing render logic works
      setArticle(prev => prev ? ({
        ...prev,
        excerpt: clean,
        content: clean,
        featured_image_url: featuredImage,
        updatedAt: saveDetail.updatedAt,
      }) : ({
        // if prev was null, create minimal article object so UI can render
        id: saveDetail.id,
        title: saveDetail.title,
        url: saveDetail.url,
        excerpt: clean,
        content: clean,
        featured_image_url: featuredImage,
        isArchived: saveDetail.isArchived,
        isRead: saveDetail.isRead,
        createdAt: saveDetail.createdAt,
        updatedAt: saveDetail.updatedAt,
        source: saveDetail.url ? (new URL(saveDetail.url).hostname.replace('www.', '')) : 'unknown'
      }));
  
      setExtracting(false);
      setExtractError(null);
      if (extractionTimeoutRef.current) { clearTimeout(extractionTimeoutRef.current); extractionTimeoutRef.current = null; }
    } catch (err: any) {
      console.error('Error handling extractor payload:', err);
      setExtracting(false);
      setExtractError(err?.message || 'Unexpected error processing article');
      if (extractionTimeoutRef.current) { clearTimeout(extractionTimeoutRef.current); extractionTimeoutRef.current = null; }
    }
  }, [article]); // include `article` so we have the latest metadata
  

  const handleMarkAsRead = async () => {
    if (!article?.id) return { success: false, error: 'Article ID not found.' };
    const result = await markAsRead(article.id);
    if (result.success) {
      fetchData(); // Refresh data to reflect changes
    }
    return result;
  };

  const handleMarkAsUnread = async () => {
    if (!article?.id) return { success: false, error: 'Article ID not found.' };
    const result = await markAsUnread(article.id);
    if (result.success) {
      fetchData(); // Refresh data to reflect changes
    }
    return result;
  };

  const handleArchive = async () => {
    if (!article?.id) return { success: false, error: 'Article ID not found.' };
    const result = await archiveSave(article.id);
    if (result.success) {
      fetchData(); // Refresh data to reflect changes
    }
    return result;
  };

  const handleUnarchive = async () => {
    if (!article?.id) return { success: false, error: 'Article ID not found.' };
    const result = await unarchiveSave(article.id);
    if (result.success) {
      fetchData(); // Refresh data to reflect changes
    }
    return result;
  };

  const handleDelete = async () => {
    if (!article?.id) return { success: false, error: 'Article ID not found.' };
    const result = await deleteSave(article.id);
    if (result.success) {
      // Optionally navigate back or show a success message then navigate
      fetchData(); // Refresh data to reflect changes
    }
    return result;
  };

  const handleShare = () => {
    if (article?.url) {
      // Implement share functionality here
      Alert.alert('Share', `Sharing: ${article.url}`);
    }
  };

  const contentWidth = Dimensions.get('window').width - 32

  // HTML tag styles
  const tagsStyles = useMemo(() => ({
    body: { color: '#232c38', fontSize: 16, lineHeight: 28 },
    h1: { fontSize: 28, fontWeight: '700' as const, marginVertical: 12 },
    h2: { fontSize: 24, fontWeight: '700' as const, marginVertical: 10 },
    h3: { fontSize: 20, fontWeight: '700' as const, marginVertical: 8 },
    p: { marginBottom: 10 },
    a: { color: '#1e88e5', textDecorationLine: 'underline' as const },
    code: { fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: 4 },
    pre: { fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: 8 },
  }), [])

  // Custom renderers
  const renderers = useMemo(() => (
    {
      iframe: ({ tnode }: any) => {
        const { src, width, height } = tnode.attributes
        return (
          <View style={{ width: contentWidth, height: (height / width) * contentWidth || 200 }}>
            <WebView source={{ uri: src }} style={{ flex: 1 }} />
          </View>
        )
      }
    }
  ), [contentWidth])

  const renderersProps = useMemo(() => ({
    a: { onPress: (_: any, href: string) => Linking.openURL(href) }
  }), [])

  if (loading || authLoading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Header title='' variant='detail' />
      <ScrollView contentContainerStyle={{ padding: 16, gap: "20px" }}>
        <Skeleton mode="light" className="h-52 w-full mb-2 rounded-xl" />
        <Skeleton mode="light" className="h-8 w-full mb-2" />
        <Skeleton mode="light" className="h-8 w-[150px] mb-2" />
      </ScrollView>
    </SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Header title='' variant='detail' />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#b91c1c', marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={{ marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#232c38', borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  return (
    <Provider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <Header
          title=""
          variant="detail"
          detailAction={(
            <ActionsDropDown
              onOpenOriginal={() => Linking.openURL(article?.url || '')}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onShare={handleShare}
              onDelete={handleDelete}
              isRead={article?.isRead || false}
              isArchived={article?.isArchived || false}
            />
          )}
        />

        <NetworkIndicator className="bg-amber-50 border border-amber-200" />

        {/* <-- WRAPPER THAT ENSURES FULL HEIGHT */}
        <View style={{ flex: 1 }}>
          {/* DEBUG: temporary backgroundColor to see ScrollView bounds */}
          <ScrollView
            style={{ flex: 1 /* ensure ScrollView fills wrapper */ }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1, minHeight: '100%' }}
            showsVerticalScrollIndicator={false}
            // debug checker: remove after confirming layout
            onLayout={(e) => console.log('ScrollView layout:', e.nativeEvent.layout)}
          >
            <Image
              source={{ uri: article?.featured_image_url }}
              style={{ width: '100%', height: 208, borderRadius: 16, backgroundColor: '#e5e7eb', marginBottom: 16 }}
              resizeMode="cover"
            />

            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>{article?.title}</Text>

            {/* <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <SvgFromXml xml={svgIcons.pen} width={14} height={14} />
                        <Text style={{ marginLeft: 6, color: '#6b7280', fontSize: 13 }}>{article?.source}</Text>
                      </View>
                    </View> */}

            {extractError && (
              <View style={{ padding: 12, backgroundColor: '#fff1f2', borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: '#b91c1c' }}>{extractError}</Text>
                <TouchableOpacity style={{ marginTop: 8 }} onPress={() => { setExtractError(null); startExtraction(article?.url || '') }}>
                  <Text style={{ color: '#1e88e5' }}>Retry extraction</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isOnline && article?.excerpt === 'Content not available offline' && (
              <View style={{ backgroundColor: '#fff7ed', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: '#92400e', textAlign: 'center' }}>
                  📱 You're viewing this article offline. Full content may not be available.
                </Text>
              </View>
            )}

            {!extracting && !extractError && article?.content ? (
              <RenderHtml
                contentWidth={Dimensions.get('window').width - 32}
                source={{ html: article.content }}
                systemFonts={systemFonts}
                tagsStyles={tagsStyles}
                renderers={renderers}
                renderersProps={renderersProps}
                baseStyle={{ width: '100%', alignSelf: 'center' }}
              />
            ): (
              <>
              <Skeleton mode="light" className="h-4 w-full mb-2 " />
              <Skeleton mode="light" className="h-4 w-full mb-2" />
              <Skeleton mode="light" className="h-4 w-[150px] mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2 " />
              <Skeleton mode="light" className="h-4 w-full mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2 " />
              <Skeleton mode="light" className="h-4 w-[150px] mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2 " />
              <Skeleton mode="light" className="h-4 w-[150px] mb-2" />
              <Skeleton mode="light" className="h-4 w-[150px] mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2 " />
              <Skeleton mode="light" className="h-4 w-[150px] mb-2" />
              <Skeleton mode="light" className="h-4 w-full mb-2" />
            </>
            )}

          </ScrollView>
        </View>

      </SafeAreaView>

      {isOnline && (
        <WebView
          ref={(r: any) => webviewRef.current = r}
          source={{ uri: article?.url || '' }}
          containerStyle={{ position: 'absolute', top: -1000, left: 0, width: 1, height: 1, opacity: 0 }}
          //   style={{ position: 'absolute', top: -1000, left: 0, width: 1, height: 1, opacity: 0 }}
          injectedJavaScript={INJECTED_EXTRACTOR}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onWebViewMessage}
          originWhitelist={['*']}
          mixedContentMode='always'
          allowsInlineMediaPlayback={false}
          startInLoadingState={false}
        />
      )}
    </Provider>
  )
}

export default ReadStashPage
