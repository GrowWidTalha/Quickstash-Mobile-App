import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, StyleSheet, ScrollView, RefreshControl, View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import Header from '~/components/header';
import { useAuth } from '~/contexts/AuthContext';
import { useStashDrawer } from '~/contexts/StashDrawerContext';
import SearchInput from '~/components/SearchInput';
import RecentSaves from '~/components/RecentSaves';
import { useSaves } from '~/contexts/SavesContext';
import { useEffect, useState } from 'react';
import {EmptyState } from "~/components/EmptyState"
import { useLocalSearchParams } from 'expo-router';

export default function Saves() {
  const { loading: authLoading } = useAuth();
  const { openDrawer } = useStashDrawer();
  const {
    saves,
    unreadArticles,
    loading,
    refreshing,
    fetchSaves
  } = useSaves();
  const params = useLocalSearchParams()
  console.log(params)
  const parseTabParam = (tab: unknown): 'all' | 'unread' => {
    if (typeof tab !== 'string' || tab.trim() === '') return 'all';
    const t = tab.toLowerCase();
    return t === 'unread' ? 'unread' : 'all';
  };

  const initialTab = parseTabParam(params?.tab);
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>(initialTab || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedTab(parseTabParam(params?.tab));
  }, [params?.tab]);

  const onRefresh = async () => {
    await fetchSaves();
  };

  const handleAddFirstStash = () => {
    openDrawer();
  };

  const displayedArticles = selectedTab === 'all' ? saves : unreadArticles;
  const filteredArticles = searchQuery
    ? displayedArticles.filter((article) =>
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.url?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayedArticles;

  return (
    <SafeAreaView className='flex-1 px-4 bg-[#FCFCFC]'>
      <Header title="Saves" variant="master" />
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {/* Tabs Filter */}
        <View className="flex-row p-2 justify-center mt-4 mb-2 bg-white border border-[#232c38] rounded-2xl overflow-hidden">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-2xl items-center justify-center ${selectedTab === 'unread' ? 'bg-[#232c38]' : 'bg-white'
              }`}
            onPress={() => setSelectedTab('unread')}
            activeOpacity={0.85}
          >
            <Text
              className={`font-pmedium text-lg ${selectedTab === 'unread' ? 'text-white' : 'text-[#232c38]'
                }`}
            >
              Unread
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1  rounded-2xl items-center justify-center ${selectedTab === 'all' ? 'bg-[#232c38]' : 'bg-white'
              }`}
            onPress={() => setSelectedTab('all')}
            activeOpacity={0.85}
          >
            <Text
              className={`font-pmedium text-lg ${selectedTab === 'all' ? 'text-white' : 'text-[#232c38]'
                }`}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>

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
        ) : filteredArticles.length === 0 ? (
          searchQuery ? (
            <EmptyState heading="No results found" subHeading="Try searching with different keywords" 
            handleAddFirstStash={handleAddFirstStash}
            
            />
          ) : (
            <EmptyState 
              heading={selectedTab === "unread" ? "You're all caught up for now" : undefined}
              subHeading={selectedTab === "unread" ? "Stash new articles to read later" : undefined}
              label={selectedTab === "unread" ? "Add new Stash" : undefined}
              handleAddFirstStash={handleAddFirstStash}
            />
          )
        ) : (
          <>
            <RecentSaves articles={filteredArticles} label={selectedTab === 'all' ? 'All Stashes' : 'Unread Stashes'} />
          </>
        )}
      </ScrollView>
    </SafeAreaView >
  );
}
