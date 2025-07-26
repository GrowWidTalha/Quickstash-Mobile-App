import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, Image, ScrollView, Platform, Linking } from 'react-native';
import Header from '~/components/header';
import Button from '~/components/Button';
import { useAuth } from '~/contexts/AuthContext';
import { Icon } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '~/constants/theme';
import { router } from 'expo-router';

export default function Profile() {
  const { signOut, user } = useAuth();

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

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <Header title="Profile" variant="master" />
      <ScrollView className="flex-1 px-4">
        {/* Avatar and Name Section */}
        <View className="items-center py-6">
          <View className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-200">
            <Image
              source={{ uri: user?.avatarUrl || 'https://www.gravatar.com/avatar/default?d=mp' }}
              className="h-full w-full"
            />
          </View>
          <Text className="text-xl font-bold text-gray-800">
            {user?.email || 'Quick Stash User'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="mt-6 gap-2 space-y-4">
          <Button
            text={`Rate us on ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'}`}
            onPress={handleRateApp}
             leftIcon={
              <MaterialCommunityIcons name="star" size={20} color={theme.colors.accent.DEFAULT} />
            }
            variant="outline"
          />

          <Button  leftIcon={
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
        <View className="mb-8">
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
