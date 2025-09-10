import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, StyleSheet, View, Image, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import Header from '~/components/header';
import SearchInput from '~/components/SearchInput';
import { useAuth } from '../../contexts/AuthContext';
import UnreadStashList from '~/components/UnreadStashList';
import { useStashDrawer } from '~/contexts/StashDrawerContext';
import RecentSaves from '~/components/RecentSaves';
import { useSaves } from '~/contexts/SavesContext';
import { NetworkIndicator } from '~/components/NetworkIndicator';
import { ShareIntentTest } from '~/components/ShareIntentTest';
import { useState } from 'react';
import { AutoSkeletonView, AutoSkeletonIgnoreView } from 'react-native-auto-skeleton';

export default function Home() {
  const { loading: authLoading } = useAuth();
  const { openDrawer } = useStashDrawer();
  const { 
    saves, 
    loading, 
    refreshing, 
    unreadArticles, 
    fetchSaves 
  } = useSaves();
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showShareTest, setShowShareTest] = useState(false);

  const onRefresh = async () => {
    await fetchSaves();
  };

  const handleAddFirstStash = () => {
    openDrawer();
  };

  return (
    <SafeAreaView className='flex-1 px-4 bg-[#FCFCFC]'>
      <Header title="Home" variant="master" />
      <SearchInput />
      <NetworkIndicator className="bg-amber-50 border border-amber-200 my-2" />
      
      {/* Development Test Buttons - Remove in production */}
      <TouchableOpacity
        onPress={() => setShowTestPanel(true)}
        className="absolute top-20 right-4 bg-gray-800 p-2 rounded-full z-10"
      >
        <Text className="text-white text-xs">🧪</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => setShowShareTest(true)}
        className="absolute top-20 right-16 bg-blue-600 p-2 rounded-full z-10"
      >
        <Text className="text-white text-xs">📤</Text>
      </TouchableOpacity>
      
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
      
      <ShareIntentTest 
        isVisible={showShareTest} 
        onClose={() => setShowShareTest(false)} 
      />
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