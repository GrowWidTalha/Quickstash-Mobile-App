import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';

// Replace with your actual image path or remote URL
const STASHY_IMAGE = require('~/assets/images/stashy-feature.png');

export default function StatsWithStashy() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        {/* Hero Section */}
        <View className="items-center mb-8">
          <Image
            source={STASHY_IMAGE}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-center mt-4 text-gray-900">
            Meet Stashy — Your AI Chat Assistant
          </Text>
          <Text className="text-base text-center text-gray-600 mt-1">
            Coming Soon to Quick Stash!
          </Text>
        </View>

        {/* Feature Highlights */}
        <View className="space-y-6 gap-2">
          <View className="bg-blue-50 rounded-2xl p-4">
            <Text className="text-lg font-semibold text-blue-900">
              🔍 Instant Article Search
            </Text>
            <Text className="mt-2 text-gray-800">
              Ask Stashy any question and get answers from all your saved articles, without opening a single link.
            </Text>
          </View>

          <View className="bg-green-50 rounded-2xl p-4">
            <Text className="text-lg font-semibold text-green-900">
              📑 Smart Summaries
            </Text>
            <Text className="mt-2 text-gray-800">
              Summarize long reads into bite-sized insights—perfect for on-the-go learning.
            </Text>
          </View>

          <View className="bg-purple-50 rounded-2xl p-4">
            <Text className="text-lg font-semibold text-purple-900">
              🔗 Contextual Links
            </Text>
            <Text className="mt-2 text-gray-800">
              Get direct quotes and links back to your favorite passages in one tap.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
