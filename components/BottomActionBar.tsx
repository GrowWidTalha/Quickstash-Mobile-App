import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

interface BottomActionBarProps {
  isRead: boolean;
  isArchived: boolean;
  onMarkAsRead: () => Promise<{ success: boolean; error?: string }>;
  onMarkAsUnread: () => Promise<{ success: boolean; error?: string }>;
  onArchive: () => Promise<{ success: boolean; error?: string }>;
  onUnarchive: () => Promise<{ success: boolean; error?: string }>;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  loadingRead?: boolean;
  loadingArchive?: boolean;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
  isRead,
  isArchived,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  loadingRead = false,
  loadingArchive = false,
}) => {
  const handleReadAction = async () => {
    if (isRead) {
      await onMarkAsUnread();
    } else {
      await onMarkAsRead();
    }
  };

  const handleArchiveAction = async () => {
    if (isArchived) {
      await onUnarchive();
    } else {
      await onArchive();
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#f8fafc' }}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Previous Button */}
        {hasPrevious && onPrevious && (
          <TouchableOpacity
            onPress={onPrevious}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Feather name="chevron-left" size={18} color="#64748b" />
          </TouchableOpacity>
        )}

        {/* Main Action Buttons */}
        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center', gap: 12 }}>
          {/* Mark as Read/Unread Button */}
          <TouchableOpacity
            onPress={handleReadAction}
            disabled={loadingRead || loadingArchive}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              paddingHorizontal: 16,
              backgroundColor: isRead ? '#f1f5f9' : '#ffffff',
              borderWidth: 1,
              borderColor: isRead ? '#cbd5e1' : '#e2e8f0',
              borderRadius: 8,
              opacity: (loadingRead || loadingArchive) ? 0.6 : 1,
              minWidth: 100,
            }}
          >
            {loadingRead ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Feather 
                name={isRead ? 'circle' : 'check-circle'} 
                size={16} 
                color={isRead ? '#64748b' : '#059669'} 
              />
            )}
            <Text style={{
              marginLeft: 6,
              fontSize: 14,
              fontWeight: '500',
              color: isRead ? '#64748b' : '#059669',
            }}>
              {isRead ? 'Unread' : 'Read'}
            </Text>
          </TouchableOpacity>

          {/* Archive/Unarchive Button */}
          <TouchableOpacity
            onPress={handleArchiveAction}
            disabled={loadingRead || loadingArchive}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              paddingHorizontal: 16,
              backgroundColor: isArchived ? '#f1f5f9' : '#ffffff',
              borderWidth: 1,
              borderColor: isArchived ? '#cbd5e1' : '#e2e8f0',
              borderRadius: 8,
              opacity: (loadingRead || loadingArchive) ? 0.6 : 1,
              minWidth: 100,
            }}
          >
            {loadingArchive ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Feather 
                name={isArchived ? 'inbox' : 'archive'} 
                size={16} 
                color={isArchived ? '#64748b' : '#d97706'} 
              />
            )}
            <Text style={{
              marginLeft: 6,
              fontSize: 14,
              fontWeight: '500',
              color: isArchived ? '#64748b' : '#d97706',
            }}>
              {isArchived ? 'Unarchive' : 'Archive'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Next Button */}
        {hasNext && onNext && (
          <TouchableOpacity
            onPress={onNext}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Feather name="chevron-right" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default BottomActionBar;
