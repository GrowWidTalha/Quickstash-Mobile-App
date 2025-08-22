import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking, Dimensions, StyleSheet, Alert } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import Header from '~/components/header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '~/contexts/AuthContext'
import { SvgFromXml } from 'react-native-svg'
import { svgIcons } from '~/components/CustomSvgIcons'
import { Menu, Provider, Dialog, Portal, Button } from 'react-native-paper'
import { MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons'
import RenderHtml, { defaultSystemFonts } from 'react-native-render-html'
import { WebView } from 'react-native-webview'
import { useSaves } from '~/contexts/SavesContext'
import { NetworkIndicator } from '~/components/NetworkIndicator'
import { Link } from 'expo-router'
import ActionsDropDown from '~/components/ActionDropDown'

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

const ReadStashPage = () => {
    const { id } = useLocalSearchParams()
    const { loading: authLoading } = useAuth()
    const { getSaveById, isOnline, markAsRead, markAsUnread, archiveSave, unarchiveSave, deleteSave } = useSaves()
    const [article, setArticle] = useState<StashArticleDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
        <SafeAreaView className="flex-1 p-4 bg-gray-50"><Header title='' variant='detail' /><ActivityIndicator className="flex-1 justify-center items-center" size='large' color='#232c38' /></SafeAreaView>
    )
    if (!article) return (
        <SafeAreaView className="flex-1 p-4 bg-gray-50"><Header title='' variant='detail' /><View className="flex-1 justify-center items-center"><Text className="text-lg text-red-500">{error}</Text><TouchableOpacity onPress={fetchData} className="mt-4 px-5 py-2 bg-gray-800 rounded-lg"><Text className="text-white font-semibold">Retry</Text></TouchableOpacity></View></SafeAreaView>
    )

    return (
        <Provider>
            <SafeAreaView className="flex-1 bg-gray-50">
                <Header
                    title=''
                    variant='detail'
                    detailAction={(
                        <ActionsDropDown
                            onOpenOriginal={() => Linking.openURL(article.url)}
                            onMarkAsRead={handleMarkAsRead}
                            onMarkAsUnread={handleMarkAsUnread}
                            onArchive={handleArchive}
                            onUnarchive={handleUnarchive}
                            onShare={handleShare}
                            onDelete={handleDelete}
                            isRead={article.isRead}
                            isArchived={article.isArchived}
                        />
                    )}
                />
                <NetworkIndicator className="bg-amber-50 border border-amber-200 my-2" />
                <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                    <Image source={{ uri: article.imageUrl }} className="w-full h-52 rounded-2xl bg-gray-100 mb-4" resizeMode='cover' />
                    <Text className="text-2xl font-bold text-gray-800 mb-3">{article.title}</Text>
                    <View className="flex-row mb-3">
                        <View className="flex-row items-center mr-4"><SvgFromXml xml={svgIcons.pen} width={14} height={14} /><Text className="ml-1 text-gray-500 text-sm">{article.source}</Text></View>
                        <View className="flex-row items-center"><SvgFromXml xml={svgIcons.clock} width={14} height={14} /><Text className="ml-1 text-gray-500 text-sm">{article.readTime} Min Read</Text></View>
                    </View>
                    <Text className="text-base text-gray-600 mb-4">{article.excerpt}</Text>
                    {!isOnline && article.content === 'Content not available offline' && (
                        <View className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                            <Text className="text-amber-800 text-sm text-center">
                                📱 You're viewing this article offline. Full content may not be available.
                            </Text>
                        </View>
                    )}
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

export default ReadStashPage
