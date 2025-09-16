import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '~/components/header';
import { NetworkIndicator } from '~/components/NetworkIndicator';
import RecentSaves from '~/components/RecentSaves';
import SearchInput from '~/components/SearchInput';
import UnreadStashList from '~/components/UnreadStashList';
import { useSaves } from '~/contexts/SavesContext';
import { useStashDrawer } from '~/contexts/StashDrawerContext';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from "~/components/EmptyState"
import { router } from 'expo-router';
import { useState } from 'react';


export default function Home() {
  const { loading: authLoading } = useAuth();
  const { openDrawer } = useStashDrawer();
  const {
    unarchivedArticles,
    loading,
    refreshing,
    unreadArticles,
    fetchSaves
  } = useSaves();
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = async () => {
    await fetchSaves();
  };

  const handleAddFirstStash = () => {
    openDrawer();
  };


  const unreadFiltered = searchQuery
    ? unreadArticles.filter((article) =>
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.url?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : unreadArticles;

  const unarchivedFiltered = searchQuery
    ? unarchivedArticles.filter((article) =>
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.url?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : unarchivedArticles;

  return (
    <SafeAreaView className='flex-1 px-4 bg-[#FCFCFC]'>
      <Header title="Home" variant="master" />
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      <NetworkIndicator className="bg-amber-50 border border-amber-200 my-2" />
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
        ) : unarchivedArticles.length === 0 && !searchQuery ? (
          <EmptyState handleAddFirstStash={handleAddFirstStash} />
        ) : searchQuery && unreadFiltered.length === 0 && unarchivedFiltered.length === 0 ? (
          <EmptyState heading="No results found" subHeading="Try searching with different keywords"
            handleAddFirstStash={handleAddFirstStash}
          />
        ) : (
          <>
            {unreadFiltered.length > 0 && (
              <UnreadStashList
                articles={unreadFiltered}
                onReadAll={() => {
                  router.push("/(tabs)/saves?tab=unread")
                }}
              />
            )}
            <RecentSaves
              articles={unarchivedFiltered}
              showMoreButton
              onReadAll={() => {
                router.push("/(tabs)/saves?tab=all")
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView >
  );
}