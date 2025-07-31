import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSaves } from '~/contexts/SavesContext';
import { OfflineStorage } from '~/lib/offlineStorage';

interface OfflineTestPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const OfflineTestPanel: React.FC<OfflineTestPanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const { 
    isOnline, 
    hasOfflineActions, 
    saves, 
    addSave, 
    syncOfflineActions 
  } = useSaves();
  
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadDebugInfo = async () => {
    const cachedSaves = await OfflineStorage.getCachedSaves();
    const cachedDetails = await OfflineStorage.getCachedSaveDetails();
    const offlineActions = await OfflineStorage.getOfflineActions();
    const lastSync = await OfflineStorage.getLastSyncTimestamp();
    
    setDebugInfo({
      cachedSavesCount: cachedSaves.length,
      cachedDetailsCount: Object.keys(cachedDetails).length,
      offlineActionsCount: offlineActions.length,
      lastSync: lastSync ? new Date(lastSync).toLocaleString() : 'Never',
      currentSavesCount: saves.length,
      isOnline,
      hasOfflineActions
    });
  };

  const testOfflineSave = async () => {
    const testUrl = `https://example.com/test-${Date.now()}`;
    await addSave(testUrl);
    await loadDebugInfo();
  };

  const clearCache = async () => {
    await OfflineStorage.clearAllCache();
    await loadDebugInfo();
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-black/50 z-50">
      <View className="flex-1 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Offline Test Panel
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-xl">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-96">
            {/* Status */}
            <View className="mb-4 p-3 rounded-lg bg-gray-50">
              <Text className="font-semibold text-gray-900 mb-2">Status</Text>
              <Text className="text-sm text-gray-600">
                Online: {isOnline ? '✅' : '❌'}
              </Text>
              <Text className="text-sm text-gray-600">
                Pending Actions: {hasOfflineActions ? '✅' : '❌'}
              </Text>
            </View>

            {/* Debug Info */}
            {debugInfo && (
              <View className="mb-4 p-3 rounded-lg bg-blue-50">
                <Text className="font-semibold text-gray-900 mb-2">Debug Info</Text>
                                 <Text className="text-xs text-gray-600">
                   Cached Saves: {debugInfo.cachedSavesCount}
                 </Text>
                 <Text className="text-xs text-gray-600">
                   Cached Details: {debugInfo.cachedDetailsCount}
                 </Text>
                 <Text className="text-xs text-gray-600">
                   Offline Actions: {debugInfo.offlineActionsCount}
                 </Text>
                <Text className="text-xs text-gray-600">
                  Current Saves: {debugInfo.currentSavesCount}
                </Text>
                <Text className="text-xs text-gray-600">
                  Last Sync: {debugInfo.lastSync}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View className="space-y-2">
              <TouchableOpacity
                onPress={loadDebugInfo}
                className="bg-blue-500 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">
                  Load Debug Info
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={testOfflineSave}
                className="bg-green-500 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">
                  Test Offline Save
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={syncOfflineActions}
                className="bg-purple-500 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">
                  Manual Sync
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearCache}
                className="bg-red-500 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">
                  Clear Cache
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}; 