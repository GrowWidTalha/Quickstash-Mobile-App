import React from 'react';
import { View, Text, Animated } from 'react-native';
import { useSaves } from '~/contexts/SavesContext';
import { WifiIcon, ExclamationTriangleIcon } from 'react-native-heroicons/outline';

interface NetworkIndicatorProps {
  className?: string;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ className = '' }) => {
  const { isOnline, hasOfflineActions } = useSaves();
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isOnline || hasOfflineActions) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animation.setValue(0);
    }
  }, [isOnline, hasOfflineActions, animation]);

  if (isOnline && !hasOfflineActions) {
    return null; // Don't show indicator when everything is normal
  }

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={{ opacity }}
      className={`flex-row items-center justify-center px-3 py-2 rounded-full mx-4 mb-2 ${className}`}
    >
      {!isOnline ? (
        <>
          <ExclamationTriangleIcon size={16} className="text-amber-500 mr-2" />
          <Text className="text-amber-500 text-sm font-medium">
            You're offline - changes will sync when connected
          </Text>
        </>
      ) : hasOfflineActions ? (
        <>
          <WifiIcon size={16} className="text-blue-500 mr-2" />
          <Text className="text-blue-500 text-sm font-medium">
            Syncing offline changes...
          </Text>
        </>
      ) : null}
    </Animated.View>
  );
}; 