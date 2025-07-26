import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking, Dimensions, StyleSheet } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import Header from '~/components/header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '~/contexts/AuthContext'
import { fetcher } from '~/lib/fetcher'
import { SvgFromXml } from 'react-native-svg'
import { svgIcons } from '~/components/CustomSvgIcons'
import { Menu, Provider } from 'react-native-paper'
import { MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons'
import RenderHtml, { defaultSystemFonts } from 'react-native-render-html'
import { WebView } from 'react-native-webview'

// Extend system fonts for code

// TODO: Add spacing and formatting for code snippets
const systemFonts = [...defaultSystemFonts, 'Menlo', 'Courier', 'monospace']

// Article type definition
interface StashArticleDetail {
    id: string;
    title: string;
    url: string;
    excerpt: string;
    imageUrl: string;
    isArchived: boolean;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
    readTime: number;
    source: string;
    content: string;
}

const ActionsDropDown = ({ onOpenOriginal, onMarkAsRead, onArchive, onShare, onDelete }: any) => {
    const [visible, setVisible] = useState(false)
    return (
        <Menu visible={visible} onDismiss={() => setVisible(false)} anchor={
            <TouchableOpacity onPress={() => setVisible(true)} style={{ padding: 8 }}>
                <Feather name="more-vertical" size={24} color="#232c38" />
            </TouchableOpacity>
        } contentStyle={{ borderRadius: 16, minWidth: 180 }}>
            <Menu.Item onPress={() => { setVisible(false); onOpenOriginal() }} title="Open Original" leadingIcon={() => <MaterialCommunityIcons name="web" size={20} color="#232c38" />} />
            <Menu.Item onPress={() => { setVisible(false); onMarkAsRead() }} title="Mark as Read" leadingIcon={() => <Feather name="check-circle" size={20} color="#232c38" />} />
            <Menu.Item onPress={() => { setVisible(false); onArchive() }} title="Archive" leadingIcon={() => <Feather name="archive" size={20} color="#232c38" />} />
            <Menu.Item onPress={() => { setVisible(false); onShare() }} title="Share" leadingIcon={() => <Feather name="share-2" size={20} color="#232c38" />} />
            <Menu.Item onPress={() => { setVisible(false); onDelete() }} title="Delete" leadingIcon={() => <AntDesign name="delete" size={20} color="#e53935" />} titleStyle={{ color: '#e53935' }} />
        </Menu>
    )
}

const ReadStashPage = () => {
    const { id } = useLocalSearchParams()
    const { loading: authLoading, getValidAccessToken } = useAuth()
    const [article, setArticle] = useState<StashArticleDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { fetchData() }, [])
    const fetchData = async () => {
        setLoading(true); setError(null)
        try {
            const token = await getValidAccessToken()
            const res = await fetcher('getSaveById', { accessToken: token, id })
            setArticle(res.data)
        } catch {
            setError('Failed to load article. Please try again.')
        } finally { setLoading(false) }
    }

    const contentWidth = Dimensions.get('window').width - 32

    // HTML tag styles
    const tagsStyles = useMemo(() => ({
        body: { color: '#232c38', fontSize: 16, lineHeight: 28 },
        h1: { fontSize: 28, fontWeight: '700', marginVertical: 12 },
        h2: { fontSize: 24, fontWeight: '700', marginVertical: 10 },
        h3: { fontSize: 20, fontWeight: '700', marginVertical: 8 },
        p: { marginBottom: 10 },
        a: { color: '#1e88e5', textDecorationLine: 'underline' },
        code: { fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: 4 },
        pre: { fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: 8 },
    }), [])

    // Custom renderers
    const renderers = useMemo(() => ({
        iframe: ({ tnode }: any) => {
            const { src, width, height } = tnode.attributes
            return (
                <View style={{ width: contentWidth, height: (height / width) * contentWidth || 200 }}>
                    <WebView source={{ uri: src }} style={{ flex: 1 }} />
                </View>
            )
        }
    }), [contentWidth])

    const renderersProps = useMemo(() => ({
        a: { onPress: (_: any, href: string) => Linking.openURL(href) }
    }), [])

    if (loading || authLoading) return (
        <SafeAreaView style={styles.container}><Header title='' variant='detail' /><ActivityIndicator style={styles.loader} size='large' color='#232c38' /></SafeAreaView>
    )
    if (!article) return (
        <SafeAreaView style={styles.container}><Header title='' variant='detail' /><View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={fetchData} style={styles.retry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View></SafeAreaView>
    )

    return (
        <Provider>
            <SafeAreaView style={styles.container}>
                <Header title='' variant='detail' detailAction={<ActionsDropDown onOpenOriginal={() => Linking.openURL(article.url)} onMarkAsRead={() => {}} onArchive={() => {}} onShare={() => {}} onDelete={() => {}} />} />
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode='cover' />
                    <Text style={styles.title}>{article.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}><SvgFromXml xml={svgIcons.pen} width={14} height={14} /><Text style={styles.metaText}>{article.source}</Text></View>
                        <View style={styles.metaItem}><SvgFromXml xml={svgIcons.clock} width={14} height={14} /><Text style={styles.metaText}>{article.readTime} Min Read</Text></View>
                    </View>
                    <Text style={styles.excerpt}>{article.excerpt}</Text>
                    <RenderHtml
                        contentWidth={contentWidth}
                        source={{ html: article.content }}
                        systemFonts={systemFonts}
                        tagsStyles={tagsStyles}
                        renderers={renderers}
                        renderersProps={renderersProps}
                    />
                </ScrollView>
            </SafeAreaView>
        </Provider>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#FCFCFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: 32 },
    image: { width: '100%', height: 200, borderRadius: 16, backgroundColor: '#F6F6F6', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '700', color: '#232c38', marginBottom: 12 },
    metaRow: { flexDirection: 'row', marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    metaText: { marginLeft: 4, color: '#888', fontSize: 14 },
    excerpt: { color: '#666', fontSize: 16, marginBottom: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 18, color: 'red' },
    retry: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#232c38', borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: '600' }
})

export default ReadStashPage
