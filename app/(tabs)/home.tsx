import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, StyleSheet, View, Image, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import Header from '~/components/header';
import SearchInput from '~/components/SearchInput';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { fetcher } from '~/lib/fetcher';
import UnreadStashList from '~/components/UnreadStashList';
import { useStashDrawer } from '~/contexts/StashDrawerContext';
import RecentSaves from '~/components/RecentSaves';

// Define the article type with isRead property
export interface StashArticle {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  imageUrl: string;
  isArchived: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  readTime: string;
  source: string
}

export default function Home() {
  const { loading: authLoading, user, getValidAccessToken, accessToken } = useAuth()
  const { openDrawer } = useStashDrawer();

  const [saves, setSaves] = useState<StashArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter read and unread articles
  const readArticles = saves.filter(article => article.isRead)
  const unreadArticles = saves.filter(article => !article.isRead)

  useEffect(() => {
    fetchData()
  }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      const accessToken = await getValidAccessToken()

      const getSavesResponse = await fetcher("getAllSaves", { accessToken })
      setSaves(getSavesResponse.data.saves)
    } catch (error) {
      // handle error if needed
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [accessToken]);

  const handleAddFirstStash = () => {
    // Open the stash drawer or navigate to add stash screen
    openDrawer()
    // You can implement this as needed
  }

  return (
    <SafeAreaView className='flex-1 px-4 bg-[#FCFCFC]'>
      <Header title="Home" variant="master" />
      <SearchInput />
      <ScrollView
        className='flex-1 h-full mt-4'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#232c38"]}
            tintColor="#232c38"
          />
        }
      >
        {loading || authLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 }}>
            <ActivityIndicator size="large" color="#232c38" />
          </View>
        ) : saves.length === 0 ? (
          <EmptyState handleAddFirstStash={handleAddFirstStash} />
        ) : (
          <>
            <UnreadStashList
              articles={unreadArticles}
            />
            <RecentSaves articles={saves} showMoreButton />
          </>
        )}
      </ScrollView>
    </SafeAreaView >
  );
}

const EmptyState = ({ handleAddFirstStash }: { handleAddFirstStash: () => void }) => {
  return <View style={{ alignItems: 'center', marginTop: 32 }}>
    <View style={{ width: 180, height: 180, marginBottom: 18, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={require('~/assets/images/empty-state-illustration.png')} style={{ width: 160, height: 160 }} resizeMode="contain" />
    </View>
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#232c38', marginBottom: 6, textAlign: 'center' }}>
      Stashy looked around... nothing here yet!
    </Text>
    <Text style={{ fontSize: 15, color: '#666', marginBottom: 24, textAlign: 'center' }}>
      Try saving something — links, articles, or ideas.
    </Text>
    <TouchableOpacity
      style={{ backgroundColor: '#232c38', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center' }}
      onPress={handleAddFirstStash}
      activeOpacity={0.85}
    >
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginRight: 10 }}>＋</Text>
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 }}>Add Your First Stash</Text>
    </TouchableOpacity>
  </View>
}