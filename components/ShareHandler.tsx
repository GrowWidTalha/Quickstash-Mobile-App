import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useSaves } from '~/contexts/SavesContext';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from 'react-native-heroicons/outline';

interface ShareHandlerProps {
  isVisible: boolean;
  onClose: () => void;
  sharedUrl?: string;
}

export const ShareHandler: React.FC<ShareHandlerProps> = ({ 
  isVisible, 
  onClose, 
  sharedUrl 
}) => {
  const { addSave, isOnline } = useSaves();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isVisible && sharedUrl) {
      handleSharedUrl(sharedUrl);
    }
  }, [isVisible, sharedUrl]);

  const handleSharedUrl = async (url: string) => {
    setStatus('processing');
    setMessage('Processing shared URL...');

    try {
      // Validate URL
      if (!isValidUrl(url)) {
        setStatus('error');
        setMessage('Invalid URL format');
        return;
      }

      // Add the URL to saves
      const result = await addSave(url);
      
      if (result.success) {
        setStatus('success');
        setMessage(
          isOnline 
            ? 'URL successfully stashed!' 
            : 'URL queued for stashing when online!'
        );
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to stash URL');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred');
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setMessage('');
    onClose();
  };

  const handleViewSaves = () => {
    handleClose();
    router.push('/(tabs)/home');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <ActivityIndicator size={24} color="#232c38" />;
      case 'success':
        return <CheckCircleIcon size={24} className="text-green-500" />;
      case 'error':
        return <XCircleIcon size={24} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className={`bg-white rounded-2xl p-6 w-full max-w-sm border-2 ${getStatusColor()}`}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Share Intent
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text className="text-gray-500 text-xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="mb-6">
            {/* Status Icon and Message */}
            <View className="flex-row items-center justify-center mb-4">
              {getStatusIcon()}
            </View>
            
            <Text className="text-center text-gray-700 mb-4">
              {message}
            </Text>

            {/* Shared URL Display */}
            {sharedUrl && (
              <View className="bg-gray-100 rounded-lg p-3 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Shared URL:</Text>
                <Text className="text-sm text-gray-800" numberOfLines={3}>
                  {sharedUrl}
                </Text>
              </View>
            )}

            {/* Offline Notice */}
            {!isOnline && status === 'success' && (
              <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <View className="flex-row items-center">
                  <ExclamationTriangleIcon size={16} className="text-amber-500 mr-2" />
                  <Text className="text-amber-700 text-sm">
                    You're offline - URL will sync when connected
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="space-y-2">
            {status === 'success' && (
              <TouchableOpacity
                onPress={handleViewSaves}
                className="bg-blue-500 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">
                  View My Saves
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleClose}
              className={`p-3 rounded-lg ${
                status === 'success' 
                  ? 'bg-gray-200' 
                  : 'bg-blue-500'
              }`}
            >
              <Text className={`text-center font-medium ${
                status === 'success' 
                  ? 'text-gray-700' 
                  : 'text-white'
              }`}>
                {status === 'success' ? 'Close' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 