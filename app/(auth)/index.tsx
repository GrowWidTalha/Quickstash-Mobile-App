import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button  from '~/components/Button';
import { Container } from '~/components/Container';
import theme from '~/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const FirstScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className='flex-1 bg-[#FFFDF6]'>
      <View className="flex-1 items-center bg-[#FFFDF6] justify-between w-full py-8">
        {/* Logo with text */}
        <View className="w-full items-center mt-2 mb-4">
          <Image
            source={require('~/assets/icons/full-logo.png')}
            style={{ width: 148, height: 45, resizeMode: 'contain' }}
          />
        </View>

        {/* Illustration */}
        <View className="flex-1 items-center justify-center w-full">
          <Image
            source={require('~/assets/icons/stashy-login-illustration.png')}
            style={{ width: 300, height: 300, resizeMode: 'contain' }}
          />
        <View className="w-full items-center -mt-8 mb-28">
          <Text className="text-4xl font-bold text-accent-700 text-center mb-2">Stash It for Later.</Text>
          <Text className="text-xs text-accent-400 text-center">Capture articles and links without slowing down.</Text>
        </View>
        </View>

        {/* Headline and subtext */}

        {/* Get Started Button */}
        <View className="w-full px-2 mb-2">
          <Button
            text="Get Started"
            variant="default"
            onPress={() => router.push('/(auth)/signup')}
            className="rounded-null text-white py-4"
            textProps={{
              className: "text-white"
            }}
          />
        </View>

        {/* Login Link */}
        <View className="w-full items-center mb-2">
          <Text className="text-base text-accent-400">
            Already have an account?{' '}
            <Text
              className="text-accent-700 font-semibold"
              onPress={() => router.push('/(auth)/signin')}
            >
              Login
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FirstScreen;