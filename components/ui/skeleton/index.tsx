import React, { useEffect } from 'react';
import { Animated, View } from 'react-native';
import { skeletonColors, animationConfig } from './styles';

export const Skeleton = ({
  className,
  mode = 'light',
  animated = true,
}: {
  className: string;
  mode?: 'light' | 'dark';
  animated?: boolean;
}) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    animatedValue.setValue(0);

    const animationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationConfig.duration,
          useNativeDriver: animationConfig.useNativeDriver,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: animationConfig.duration,
          useNativeDriver: animationConfig.useNativeDriver,
        }),
      ])
    );

    animationLoop.start();
    return () => {
      animationLoop.stop();
    };
  }, [mode]);

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      mode === 'dark' ? skeletonColors.dark.base : skeletonColors.light.base,
      mode === 'dark' ? skeletonColors.dark.highlight : skeletonColors.light.highlight,
    ],
  });

  return animated ? (
    <Animated.View
      className={`overflow-hidden ${className}`}
      style={[{ backgroundColor: animatedBackgroundColor }]}
    />
  ) : (
    <View
      className={`overflow-hidden ${className}`}
      style={{
        backgroundColor: mode === 'dark' ? skeletonColors.dark.base : skeletonColors.light.base,
      }}
    />
  );
};
