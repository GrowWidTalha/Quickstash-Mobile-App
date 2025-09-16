import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Image, Linking, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native'
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
import { StashArticle, useSaves } from '~/contexts/SavesContext'
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
  isFetchingAllowed?: boolean;
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
  const [isPaywalled, setIsPaywalled] = useState(false)

  const [shouldExtract, setShouldExtract] = useState(false); // whether we should run extractor now
  const [backgroundRefresh, setBackgroundRefresh] = useState(false); // whether we're silently refreshing
  const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
  const ENABLE_BACKGROUND_REFRESH = false; // set to true only if you want silent refreshes

  const webviewRef = useRef<WebView | null>(null)
  const extractionTimeoutRef = useRef<number | null>(null)





  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error: fetchError } = await getSaveById(id as string)
      if (fetchError || !data) {
        setError(fetchError || 'Failed to fetch save')
      } else {
        // set base article from API (this includes fields like id, url, title)
        setArticle(data as StashArticle)
        // check cache and extract only if needed (or background refresh)
        await checkCacheThenMaybeExtract(data as StashArticle)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load article. Please try again.')
    } finally { setLoading(false) }
  }

  const INJECTED_EXTRACTOR = `
(function(){
  // --- utilities ---
  function loadScript(src, cb){
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = cb;
    document.documentElement.appendChild(s);
  }

  function safePost(obj){
    try {
      var msg = JSON.stringify(obj);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.postMessage) {
        // fallback (older RN webview/native setups)
        window.postMessage(msg);
      } else {
        // last fallback: console
        console.log('EXTRACTOR_MSG', msg);
      }
    } catch (e) {
      console.error('post error', e);
    }
  }

  // Remove potentially dangerous nodes and attributes
  function stripDangerous(el){
    if (!el) return;
    var bad = el.querySelectorAll('script,noscript,iframe,link,style,form,object,embed');
    bad.forEach(function(n){ n.parentNode && n.parentNode.removeChild(n) });

    // remove inline event handlers and javascript: hrefs
    var all = el.getElementsByTagName('*');
    for(var i=0;i<all.length;i++){
      var attrs = all[i].attributes;
      for(var j=attrs.length-1;j>=0;j--){
        var name = attrs[j].name || '';
        var val = attrs[j].value || '';
        if(name.toLowerCase().indexOf('on') === 0){
          all[i].removeAttribute(name);
        } else if(name.toLowerCase() === 'href' && val.trim().toLowerCase().indexOf('javascript:') === 0){
          all[i].removeAttribute('href');
        }
      }
    }
  }

  // Expand lazy-loaded images (data-src, data-lazy, data-original, srcset)
  function expandLazyImages(root){
    try {
      var imgs = (root || document).querySelectorAll('img');
      imgs.forEach(function(img){
        var attrCandidates = ['data-src','data-lazy','data-original','data-srcset','data-actualsrc','data-hires'];
        for(var k=0;k<attrCandidates.length;k++){
          var a = attrCandidates[k];
          if(img.hasAttribute(a) && !img.src){
            img.src = img.getAttribute(a);
          }
        }
        if(img.hasAttribute('data-srcset') && !img.getAttribute('srcset')){
          img.setAttribute('srcset', img.getAttribute('data-srcset'));
        }
      });
    } catch(e){}
  }

  // Try clicking "read more" type buttons to expand truncated content
  function clickReadMore(root){
    try {
      var buttons = Array.from((root || document).querySelectorAll('button,a,span'));
      var triggers = ['read more','show more','view full','continue reading','more','expand','read full','load more'];
      buttons.forEach(function(b){
        try{
          var t = (b.innerText || b.textContent || '').toLowerCase().trim();
          if(!t) return;
          for(var i=0;i<triggers.length;i++){
            if(t.indexOf(triggers[i]) !== -1){
              // visible check
              var rect = b.getBoundingClientRect && b.getBoundingClientRect();
              if(!rect || rect.width === 0 && rect.height === 0) return;
              try { b.click(); } catch(e) {}
              return;
            }
          }
        }catch(e){}
      });
    } catch(e){}
  }

  // Parse JSON-LD structured data and return useful article fields if present
  function parseJsonLD(){
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for(var i=0;i<scripts.length;i++){
      try {
        var json = JSON.parse(scripts[i].textContent);
        // json might be array or single object
        var candidates = Array.isArray(json) ? json : [json];
        for(var j=0;j<candidates.length;j++){
          var obj = candidates[j];
          if(!obj) continue;
          var t = (obj['@type'] || '').toLowerCase();
          if(t === 'newsarticle' || t === 'article' || t === 'blogposting' || t.indexOf('article') !== -1){
            return {
              title: obj.headline || obj.name || obj.title,
              author: (obj.author && (obj.author.name || obj.author)) || (Array.isArray(obj.author) && obj.author[0] && obj.author[0].name),
              datePublished: obj.datePublished || obj.dateCreated || obj.dateModified,
              lead: (obj.image && (typeof obj.image === 'string' ? obj.image : (obj.image.url || (Array.isArray(obj.image) && obj.image[0])))) || null,
              body: obj.articleBody || obj.description || null
            };
          }
        }
      } catch(e){}
    }
    return null;
  }

  // Read OpenGraph / Twitter / meta tags
  function parseMeta(){
    var g = function(q){ var el = document.querySelector(q); return el ? el.getAttribute('content') : null; };
    return {
      ogTitle: g('meta[property="og:title"]') || g('meta[name="twitter:title"]') || document.title || null,
      ogDesc: g('meta[property="og:description"]') || g('meta[name="twitter:description"]') || g('meta[name="description"]') || null,
      ogImage: g('meta[property="og:image"]') || g('meta[name="twitter:image"]') || null,
      author: g('meta[name="author"]') || null,
      published: g('meta[property="article:published_time"]') || g('meta[name="article:published_time"]') || null,
      lang: document.documentElement.lang || document.documentElement.getAttribute('lang') || null
    };
  }

  // Choose the "best" content node by word count and link-density heuristics
  function findBestCandidate(){
    var selectors = ['article','main','[role="article"]','[role="main"]','[itemprop="articleBody"]','.post','.article','.entry-content','.content'];
    var nodes = [];
    selectors.forEach(function(sel){
      Array.from(document.querySelectorAll(sel)).forEach(n => nodes.push(n));
    });
    // if none found, consider body children
    if(nodes.length === 0){
      nodes = Array.from(document.body.children);
    }

    function textScore(n){
      try {
        var text = (n.innerText || '').trim();
        var words = text.split(/\\s+/).filter(Boolean).length;
        var links = n.querySelectorAll('a').length;
        var linkDensity = links === 0 ? 0 : links / Math.max(1, words);
        // prefer large text and low link density, slightly favor nodes with headings
        var score = words * (1 - Math.min(linkDensity, 0.9));
        if(n.querySelector('h1,h2')) score *= 1.08;
        return score;
      } catch(e){ return 0; }
    }

    var best = null;
    var bestScore = 0;
    nodes.forEach(function(n){
      var s = textScore(n);
      if(s > bestScore){
        bestScore = s;
        best = n;
      }
    });
    return {node: best, score: bestScore};
  }

  // sanitize and produce clean html string from node
  function cleanHTMLFromNode(node){
    if(!node) return '';
    var clone = node.cloneNode(true);
    stripDangerous(clone);
    expandLazyImages(clone);
    // remove likely "related"/"recommended" blocks via class substrings
    var junkSelectors = ['.related', '.recommended', '.share', '.social', '.post-nav', '.comments', '.comment', '.subscribe', '.ad-','[aria-label="ads"]'];
    junkSelectors.forEach(function(sel){
      try {
        Array.from(clone.querySelectorAll('[class*="' + sel.replace('.', '') + '"]')).forEach(n => n.parentNode && n.parentNode.removeChild(n));
      } catch(e){}
    });
    return clone.innerHTML || '';
  }

  // merge fields from multiple sources with simple heuristics
  function mergeArticle(readabilityArticle, jsonld, meta, fallbackNode){
    var article = {
      title: null,
      content: null,
      textContent: null,
      excerpt: null,
      byline: null,
      lead_image_url: null,
      published_date: null,
      lang: meta.lang || null,
      isReadability: !!readabilityArticle
    };

    // title preference: json-ld > og > readability > document.title
    article.title = (jsonld && jsonld.title) || meta.ogTitle || (readabilityArticle && readabilityArticle.title) || document.title;

    // byline
    article.byline = (jsonld && jsonld.author) || meta.author || (readabilityArticle && (readabilityArticle.byline || readabilityArticle.author)) || '';

    // published date
    article.published_date = (jsonld && jsonld.datePublished) || meta.published || (readabilityArticle && readabilityArticle.pubDate) || null;

    // lead image
    article.lead_image_url = (jsonld && jsonld.lead) || meta.ogImage || (readabilityArticle && readabilityArticle.lead_image_url) || null;

    // content: prefer readability.content (clean) else jsonld.body else cleaned fallback node
    if(readabilityArticle && readabilityArticle.content && (readabilityArticle.content.length > 100)) {
      article.content = readabilityArticle.content;
      article.textContent = readabilityArticle.textContent || (readabilityArticle.content.replace(/<[^>]+>/g,'').slice(0,3000));
    } else if(jsonld && jsonld.body){
      article.content = '<div>' + jsonld.body + '</div>';
      article.textContent = (jsonld.body || '').replace(/<[^>]+>/g,'');
    } else if(fallbackNode){
      article.content = cleanHTMLFromNode(fallbackNode.node || fallbackNode);
      article.textContent = (fallbackNode.node ? (fallbackNode.node.innerText || '') : (fallbackNode.innerText || '')) || '';
    } else {
      article.content = '';
      article.textContent = '';
    }

    // excerpt: prefer meta desc then readability excerpt then generated excerpt
    article.excerpt = (meta.ogDesc) || (readabilityArticle && (readabilityArticle.excerpt || (readabilityArticle.textContent || '').slice(0,300))) || (article.textContent || '').slice(0,300);

    return article;
  }

  // Detect paywall indicators
  

  // main parsing attempt
  function tryParse(){
    try {
      // Check for paywall first

      // Pre steps: click "read more" and expand lazy images to maximize available content
      clickReadMore(document);
      expandLazyImages(document);

      var meta = parseMeta();
      var jsonld = parseJsonLD();

      // Prepare an isolated document for Readability (safer than passing entire original document)
      function createReadabilityDoc(htmlString){
        var dd = document.implementation.createHTMLDocument(document.title || '');
        try { dd.body.innerHTML = htmlString; } catch(e){ dd.body.innerHTML = (htmlString || ''); }
        dd.title = document.title || dd.title;
        return dd;
      }

      // Candidate node for fallback
      var fallbackNode = findBestCandidate();

      // Attempt to use JSON-LD body first if it's long enough
      if(jsonld && jsonld.body && jsonld.body.length > 200){
        var tmpDoc = createReadabilityDoc(jsonld.body);
        // we won't run Readability on it; use jsonld directly as main source
        var article = mergeArticle(null, jsonld, meta, { node: tmpDoc.body });
        // sanitize final HTML
        var container = document.createElement('div'); container.innerHTML = article.content || '';
        stripDangerous(container);
        article.content = container.innerHTML;
        safePost({ ok: true, source: 'jsonld', article: article });
        return;
      }

      // Try Readability (load lib if needed)
      var runReadability = function(){
        try {
          // Build a cleaned HTML string from the fallback candidate (prefer content-focused node)
          var candidateHTML = '';
          if(fallbackNode && fallbackNode.node){
            candidateHTML = cleanHTMLFromNode(fallbackNode.node);
          } else {
            candidateHTML = cleanHTMLFromNode(document.body);
          }

          // Create a small document for Readability to avoid head/meta noise
          var rdDoc = createReadabilityDoc(candidateHTML);

          // Run Readability
          var article = null;
          try {
            if(window.Readability && typeof window.Readability === 'function'){
              article = new Readability(rdDoc).parse();
            } else if (typeof Readability === 'function') {
              article = new Readability(rdDoc).parse();
            }
          } catch(e) {
            article = null;
          }

          // Merge results with metadata
          var merged = mergeArticle(article, jsonld, meta, fallbackNode);

          // Sanitize content HTML strongly before sending
          var container = document.createElement('div');
          container.innerHTML = merged.content || '';
          stripDangerous(container);
          // Optionally remove empty nodes and whitespace
          merged.content = container.innerHTML;

          // final heuristics: if both content and textContent are very short, prefer fallback node content
          if(((merged.textContent || '').trim().length < 120) && fallbackNode && fallbackNode.node){
            merged.content = cleanHTMLFromNode(fallbackNode.node);
            merged.textContent = (fallbackNode.node.innerText || '').slice(0,5000);
            merged.excerpt = merged.textContent.slice(0,300);
            merged.isReadability = !!article;
          }

          safePost({ ok: true, source: (article ? 'readability' : 'fallback'), article: merged });
        } catch(err) {
          safePost({ ok:false, err: 'parse-run: ' + (err && err.message) });
        }
      };

      if(window.Readability){
        runReadability();
      } else {
        // load Readability and run; but also set a timeout fallback to run anyway (in case script doesn't load)
        var done = false;
        loadScript('https://unpkg.com/@mozilla/readability@0.4.4/Readability.js', function(){
          if(done) return;
          done = true;
          setTimeout(runReadability, 0);
        });
        // fallback attempt after 2s in any case
        setTimeout(function(){
          if(done) return;
          done = true;
          runReadability();
        }, 2000);
      }

    } catch(e){
      safePost({ ok:false, err: 'tryParse: ' + (e && e.message) });
    }
  }

  // Start when DOM ready
  function start(){
    try {
      // quick pre-clean
      stripDangerous(document.documentElement);
      if(document.readyState === 'complete' || document.readyState === 'interactive'){
        tryParse();
      } else {
        document.addEventListener('DOMContentLoaded', tryParse);
        // also attempt after 3s because some sites are SPA-like
        setTimeout(tryParse, 3000);
      }
    } catch(e){
      safePost({ ok:false, err: 'start: ' + (e && e.message) });
    }
  }

  start();
})(); true;
`;


  const startExtraction = (url: string) => {
    console.log("Starting Extraction process")
    setExtractError(null)
    setExtracting(true)
    // clear previous timeout
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current)
      extractionTimeoutRef.current = null
    }
    // set a safety timeout (30s) - increased for better reliability
    extractionTimeoutRef.current = setTimeout(() => {
      setExtracting(false)
      setIsPaywalled(true)
      setExtractError('Extraction timed out — site may block extraction or be paywalled.')
    }, 30000) as unknown as number

    // load the URL into the hidden webview (we render it below).
    // just ensure webviewRef.current exists and reloads with new url
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`)
    }
    // Alternatively we mount the WebView with source uri prop tied to article.url.
    // The WebView below will run the injected script on load.
  }

  const checkCacheThenMaybeExtract = useCallback(async (articleFromAPI: StashArticle | null) => {
    console.log("Starting CheckCacheThenMaybeExtract")
    if (!articleFromAPI || !articleFromAPI.id) {
      setShouldExtract(false);
      return;
    }

    try {
      const cached = await OfflineStorage.getCachedSaveDetail(articleFromAPI.id);
      // If we have cached content, use it and DO NOT extract again by default.
      if (cached && cached.content && cached.content.length > 100) {
        setArticle(prev => prev ? ({
          ...prev,
          excerpt: cached.content,
          content: cached.content,
          featured_image_url: prev?.featured_image_url || cached.featured_image_url || articleFromAPI.featured_image_url,
          updatedAt: cached.updatedAt || prev?.updatedAt || articleFromAPI.updatedAt,
        }) : ({
          ...articleFromAPI,
          excerpt: cached.content,
          content: cached.content,
          featured_image_url: cached.featured_image_url || articleFromAPI.featured_image_url,
          updatedAt: cached.updatedAt || articleFromAPI.updatedAt,
          source: articleFromAPI.url ? (new URL(articleFromAPI.url).hostname.replace('www.', '')) : 'unknown'
        }));

        // Never auto-extract when cache exists unless ENABLE_BACKGROUND_REFRESH = true
        setShouldExtract(false);

        // Optionally trigger a silent background refresh — only when flag enabled
        if (ENABLE_BACKGROUND_REFRESH && isOnline) {
          const updatedAtMs = cached.updatedAt ? new Date(cached.updatedAt).getTime() : 0;
          if (!cached.updatedAt || (Date.now() - updatedAtMs) > CACHE_TTL_MS) {
            setBackgroundRefresh(true);
            // Start background extraction but it will not clobber UI until onWebViewMessage updates the cache.
            startExtraction(articleFromAPI.url);
          } else {
            setBackgroundRefresh(false);
          }
        } else {
          setBackgroundRefresh(false);
        }
        return;
      }

      // No good cached content — extract if online and fetching is allowed, otherwise show appropriate message
      setShouldExtract(true);
      if (isOnline && (articleFromAPI.isFetchingAllowed !== false)) {
        startExtraction(articleFromAPI.url);
      } else if (!isOnline) {
        setExtractError('Content not available offline');
      } else if (articleFromAPI.isFetchingAllowed === false) {
        setIsPaywalled(true);
        setExtractError('Content extraction is not allowed for this site');
      }
    } catch (err) {
      console.error('Cache check failed:', err);
      // fallback extraction attempt if online and fetching is allowed
      setShouldExtract(true);
      if (isOnline && (articleFromAPI.isFetchingAllowed !== false)) {
        startExtraction(articleFromAPI.url);
      } else if (!isOnline) {
        setExtractError('Content not available offline');
      } else if (articleFromAPI.isFetchingAllowed === false) {
        setIsPaywalled(true);
        setExtractError('Content extraction is not allowed for this site');
      }
    }
  }, [startExtraction]);



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
      
      // Handle paywall detection specifically
      if (payload.paywalled || payload.err === 'paywall_detected') {
        setIsPaywalled(true);
        setExtractError('This content appears to be behind a paywall or subscription.');
        // Update the article to mark fetching as not allowed
        setArticle(prev => prev ? { ...prev, isFetchingAllowed: false } : null);
      } else {
        setExtractError(payload.err || 'Extraction failed');
      }
      
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
      setBackgroundRefresh(false);
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

  const handleShare = async () => {
    try {
      if (article?.url) {
        const result = await Share.share({
          message: article.url, // you can also include title + text
          url: article.url,     // on iOS, this is useful
        });
  
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            // shared with activity type (iOS)
            console.log("Shared with activity type:", result.activityType);
          } else {
            console.log("Shared successfully");
          }
        } else if (result.action === Share.dismissedAction) {
          console.log("Share dismissed");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "Unable to share: " + error.message);
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
            // onLayout={(e) => console.log('ScrollView layout:', e.nativeEvent.layout)}
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
              <View style={{ padding: 12, backgroundColor: isPaywalled ? '#fff7ed' : '#fff1f2', borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: isPaywalled ? '#92400e' : '#b91c1c' }}>{extractError}</Text>
                
                {isPaywalled ? (
                  <View style={{ marginTop: 8, flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1e88e5', borderRadius: 6 }}
                      onPress={() => Linking.openURL(article?.url || '')}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Open Original</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 6 }}
                      onPress={() => { 
                        setExtractError(null); 
                        setIsPaywalled(false); 
                        setArticle(prev => prev ? { ...prev, isFetchingAllowed: true } : null);
                        startExtraction(article?.url || '') 
                      }}
                    >
                      <Text style={{ color: '#374151', fontWeight: '600' }}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={{ marginTop: 8 }} onPress={() => { setExtractError(null); startExtraction(article?.url || '') }}>
                    <Text style={{ color: '#1e88e5' }}>Retry extraction</Text>
                  </TouchableOpacity>
                )}
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
            ) : (
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

      {isOnline && (article?.isFetchingAllowed !== false) && (shouldExtract || backgroundRefresh || extracting) && (
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
