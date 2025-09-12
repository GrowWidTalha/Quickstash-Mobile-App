import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useSaves } from '~/contexts/SavesContext';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from 'react-native-heroicons/outline';
import { Container } from './Container';
import Button from './ui/button';

interface ShareHandlerProps {
  isVisible: boolean;
  onClose: () => void;
  sharedUrl?: string;
}

export const ShareHandler: React.FC<ShareHandlerProps> = ({
  isVisible,
  onClose,
  sharedUrl,
}: ShareHandlerProps) => {
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
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className={`bg-white rounded-3xl shadow-sm p-6 w-full max-w-sm border border-neutral-200 ${getStatusColor()}`}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-pmedium text-accent">Share Intent</Text>
            <TouchableOpacity onPress={handleClose} className="rounded-full p-1 hover:bg-neutral-100">
              <Text className="text-gray-400 text-2xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Status Icon and Message */}
          <View className="items-center mb-4">
            {getStatusIcon()}
            <Text className="text-center text-gray-700 mt-2 font-pregular text-base min-h-[24px]">{message}</Text>
          </View>

          {/* Shared URL Display */}
          {sharedUrl && (
            <View className="bg-neutral-100 rounded-xl p-3 mb-4 border border-neutral-200">
              <Text className="text-xs text-gray-500 mb-1 font-pregular">Shared URL:</Text>
              <Text className="text-sm text-gray-800 font-pmedium" numberOfLines={3}>{sharedUrl}</Text>
            </View>
          )}

          {/* Offline Notice */}
          {!isOnline && status === 'success' && (
            <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex-row items-center">
              <ExclamationTriangleIcon size={16} className="text-amber-500 mr-2" />
              <Text className="text-amber-700 text-sm font-pregular">You're offline - URL will sync when connected</Text>
            </View>
          )}

          {/* Actions */}
          <View className="gap-3 mt-2">
            {status === 'success' && (
              <Button
                variant="default"
                onPress={handleViewSaves}
                className="w-full"
              >
                View My Saves
              </Button>
            )}
            <Button
              variant={status === 'success' ? 'outline' : 'default'}
              onPress={handleClose}
              className="w-full"
            >
              {status === 'success' ? 'Close' : 'Try Again'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 