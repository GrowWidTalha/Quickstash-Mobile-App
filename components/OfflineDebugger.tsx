import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineDebuggerProps {
  debugOfflineMode: boolean;
  onToggleOffline: () => void;
}

export const OfflineDebugger = ({ debugOfflineMode, onToggleOffline }: OfflineDebuggerProps) => {
  const [info, setInfo] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const checkCache = async () => {
    const userRaw = await AsyncStorage.getItem('offline_last_user');
    const userId = await AsyncStorage.getItem('offline_user_id');
    const savesRaw = await AsyncStorage.getItem('cached_saves');
    
    let parsedUser = null;
    let parsedSaves = null;
    
    try {
      parsedUser = userRaw ? JSON.parse(userRaw) : null;
    } catch (e) {
      console.error('Failed to parse user', e);
    }
    
    try {
      parsedSaves = savesRaw ? JSON.parse(savesRaw) : null;
    } catch (e) {
      console.error('Failed to parse saves', e);
    }
    
    setInfo({
      hasUser: !!userRaw,
      hasUserId: !!userId,
      hasSaves: !!savesRaw,
      userEmail: parsedUser?.email || null,
      userId: userId,
      savesCount: Array.isArray(parsedSaves) ? parsedSaves.length : 0,
    });
  };

  const clearCache = async () => {
    await AsyncStorage.multiRemove([
      'offline_last_user',
      'offline_user_id',
      'cached_saves',
      'cached_save_details_meta',
    ]);
    setInfo(null);
    alert('Cache cleared! Restart the app to see changes.');
  };

  // Only show in development mode
  if (!__DEV__) return null;

  return (
    <View style={{ 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      backgroundColor: 'rgba(0,0,0,0.95)', 
      zIndex: 9999,
      borderTopWidth: 2,
      borderTopColor: debugOfflineMode ? '#ef4444' : '#22c55e',
    }}>
      {/* Collapse/Expand Button */}
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)}
        style={{ 
          backgroundColor: debugOfflineMode ? '#ef4444' : '#22c55e',
          padding: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
          🔧 DEBUG MODE {expanded ? '▼' : '▲'} | Status: {debugOfflineMode ? '🔴 OFFLINE' : '🟢 ONLINE'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={{ maxHeight: 300, padding: 12 }}>
          {/* Toggle Offline Mode */}
          <TouchableOpacity 
            onPress={onToggleOffline}
            style={{ 
              backgroundColor: debugOfflineMode ? '#ef4444' : '#22c55e',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              {debugOfflineMode ? '📡 Go Online' : '✈️ Go Offline'}
            </Text>
          </TouchableOpacity>

          {/* Check Cache Button */}
          <TouchableOpacity 
            onPress={checkCache}
            style={{ 
              backgroundColor: '#3b82f6',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              🔍 Check Cache
            </Text>
          </TouchableOpacity>

          {/* Clear Cache Button */}
          <TouchableOpacity 
            onPress={clearCache}
            style={{ 
              backgroundColor: '#f59e0b',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              🗑️ Clear Cache
            </Text>
          </TouchableOpacity>

          {/* Cache Info Display */}
          {info && (
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 12,
              borderRadius: 8,
              marginTop: 8,
            }}>
              <Text style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: 8 }}>
                📊 Cache Status:
              </Text>
              <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
                User Cached: {info.hasUser ? '✅' : '❌'}
              </Text>
              {info.userEmail && (
                <Text style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>
                  Email: {info.userEmail}
                </Text>
              )}
              <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
                UserId Cached: {info.hasUserId ? '✅' : '❌'}
              </Text>
              {info.userId && (
                <Text style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>
                  ID: {info.userId.substring(0, 20)}...
                </Text>
              )}
              <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
                Saves Cached: {info.hasSaves ? '✅' : '❌'} ({info.savesCount} items)
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            padding: 12,
            borderRadius: 8,
            marginTop: 8,
          }}>
            <Text style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>
              💡 Testing Instructions:
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 10, lineHeight: 16 }}>
              1. Sign in while ONLINE{'\n'}
              2. Check cache to verify data is stored{'\n'}
              3. Go OFFLINE using the toggle{'\n'}
              4. Restart the app or navigate away{'\n'}
              5. App should load with cached data
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

