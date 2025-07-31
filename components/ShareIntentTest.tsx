import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useShareIntent } from '~/contexts/ShareIntentContext';

interface ShareIntentTestProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ShareIntentTest: React.FC<ShareIntentTestProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const { showShareIntent } = useShareIntent();
  const [testUrl, setTestUrl] = useState('https://example.com');

  const handleTestShare = () => {
    if (testUrl.trim()) {
      showShareIntent(testUrl.trim());
      onClose();
    }
  };

  const testUrls = [
    'https://www.google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://medium.com',
    'https://dev.to'
  ];

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900">
              Test Share Intent
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Custom URL Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Custom URL:
            </Text>
            <TextInput
              value={testUrl}
              onChangeText={setTestUrl}
              placeholder="Enter URL to test"
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              onPress={handleTestShare}
              className="bg-blue-500 p-3 rounded-lg mt-3"
            >
              <Text className="text-white text-center font-medium">
                Test Custom URL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Test URLs */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Quick Test URLs:
            </Text>
            <View className="space-y-2">
              {testUrls.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    showShareIntent(url);
                    onClose();
                  }}
                  className="bg-gray-100 p-3 rounded-lg"
                >
                  <Text className="text-gray-800 text-sm">
                    {url}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-blue-800 text-sm font-medium mb-2">
              How to test:
            </Text>
            <Text className="text-blue-700 text-xs leading-5">
              1. Tap any URL above to simulate a share intent{'\n'}
              2. The ShareHandler modal will appear{'\n'}
              3. The URL will be automatically stashed{'\n'}
              4. Works offline - URLs are queued for sync
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 