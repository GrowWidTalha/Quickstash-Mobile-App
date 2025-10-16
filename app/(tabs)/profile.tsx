import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, Image, ScrollView, Platform, Linking, TouchableOpacity } from 'react-native';
import Header from '~/components/header';
import Button from '~/components/Button';
import { useAuth } from '~/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '~/constants/theme';
import { router } from 'expo-router';
import { useSaves } from '~/contexts/SavesContext';
import { OfflineStorage } from '~/lib/offlineStorage';
import * as Sentry from '@sentry/react-native';

export default function Profile() {
  const { signOut, user } = useAuth();
  const {
    saves,
    archivedArticles,
    unarchiveSave,
    fetchSaves,
    syncOfflineActions,
    isOnline,
    hasOfflineActions,
    loading,
  } = useSaves();

  const handleRateApp = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/idXXXXXXXXXX'); // Replace with actual App Store ID
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.quickstash.app'); // Replace with actual Play Store ID
    }
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@quickstash.pro');
  };

  const handleSyncOffline = async () => {
    await syncOfflineActions();
  };

  const handleClearCache = async () => {
    await OfflineStorage.clearAllCache();
    await fetchSaves();
  };

  const handleRefresh = async () => {
    await fetchSaves();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <Header title="Settings" variant="master" />
      <ScrollView className="flex-1 px-4">
        {/* Avatar and Name Section */}
        <View className="items-center py-6">
          <View className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-200">
            <Image
              source={{ uri: ((user as any)?.user_metadata?.avatar_url) || 'https://www.gravatar.com/avatar/default?d=mp' }}
              className="h-full w-full"
            />
          </View>
          <Text className="text-xl font-bold text-gray-800">
            {user?.email || 'Quick Stash User'}
          </Text>
          <View className="mt-2 flex-row items-center space-x-2">
            <View className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <Text className="text-gray-600 text-xs ml-2">
              {isOnline ? 'Online' : 'Offline'}{hasOfflineActions ? ' • Pending sync' : ''}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-4">
          <Text className="text-gray-700 font-semibold mb-3">Quick actions</Text>
          <View className="gap-3">
            <Button
              text={hasOfflineActions ? 'Sync offline actions (pending)' : 'Sync offline actions'}
              onPress={handleSyncOffline}
              leftIcon={
                <MaterialCommunityIcons name="sync" size={20} color={'#fff'} />
              }
              variant="default"
              disabled={!hasOfflineActions || !isOnline}
            />
            <Button
              text="View archived"
              onPress={() => router.push('/(tabs)/archived')}
              leftIcon={
                <MaterialCommunityIcons name="archive-outline" size={20} color={theme.colors.accent.DEFAULT} />
              }
              variant="outline"
            />
            <Button
              text={loading ? 'Refreshing…' : 'Refresh saves'}
              onPress={handleRefresh}
              leftIcon={
                <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.accent.DEFAULT} />
              }
              variant="outline"
              disabled={loading}
            />
            <Button
              text="Clear cache"
              onPress={handleClearCache}
              leftIcon={
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={'#fff'} />
              }
              variant="destructive"
            />
          </View>
        </View>

        {/* App Links */}
        <View className="mt-6 gap-2 space-y-4">
          <Button
            text={`Rate us on ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'}`}
            onPress={handleRateApp}
            leftIcon={
              <MaterialCommunityIcons name="star" size={20} color={theme.colors.accent.DEFAULT} />
            }
            variant="outline"
          />

          <Button leftIcon={
            <MaterialCommunityIcons name="email" size={20} color={theme.colors.accent.DEFAULT} />
          } text="Contact Support" onPress={handleSupport} variant="outline" />
          <Button
            text=" Logout"
            leftIcon={
              <MaterialCommunityIcons name="logout" size={20} color={theme.colors.accent.DEFAULT} />
            }
            onPress={() => {
              signOut()
              router.push("/(auth)")
            }}
            variant="outline"
          />
        </View>
        {/* <Button text='Try!' onPress={() => { console.log("hello"); Sentry.captureException(new Error('First error')) }}/> */}

      {/* Archived link moved to dedicated screen */}

      <View className="h-10" />
    </ScrollView>
  </SafeAreaView>
);
}