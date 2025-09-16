import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ScrollView, RefreshControl, View, ActivityIndicator } from 'react-native';
import Header from '~/components/header';
import SearchInput from '~/components/SearchInput';
import RecentSaves from '~/components/RecentSaves';
import { useSaves } from '~/contexts/SavesContext';
import { useEffect, useState } from 'react';

export default function Archived() {
  const { archivedArticles, loading, refreshing, fetchSaves } = useSaves();
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = async () => {
    await fetchSaves();
  };

  const filteredArticles = searchQuery
    ? archivedArticles.filter((article) =>
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.url?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : archivedArticles;

  return (
    <SafeAreaView className='flex-1 px-4 bg-[#FCFCFC]'>
      <Header title="Archived" variant="detail" />
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

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
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 }}>
            <ActivityIndicator size="large" color="#232c38" />
          </View>
        ) : filteredArticles.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <Text className='text-center text-[#666]'>No archived articles.</Text>
          </View>
        ) : (
          <RecentSaves articles={filteredArticles} label={'Archived'} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


