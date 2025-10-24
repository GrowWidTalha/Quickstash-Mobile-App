import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import theme from '~/constants/theme';
import { setOnboardingCompleted } from '~/lib/onboardingStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreen {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: any;
  icon: string;
  color: string;
}

const BACKGROUND_COLOR = '#FEFCF5';

const onboardingScreens: OnboardingScreen[] = [
  {
    id: 1,
    title: 'Welcome to QuickStash!',
    subtitle: 'Congratulations on downloading our app!',
    description: 'You\'ve made a great choice. QuickStash is your personal URL vault that works everywhere, even offline.',
    image: require('~/assets/icons/stashy-login-illustration.png'),
    icon: 'party-popper',
    color: theme.colors.quickStashPrimary,
  },
  {
    id: 2,
    title: 'Save URLs Instantly',
    subtitle: 'Never lose a link again',
    description: 'Quickly save any URL with just a tap. Your links are organized and ready to access whenever you need them.',
    image: require('~/assets/images/stashy-feature.png'),
    icon: 'bookmark-plus',
    color: theme.colors.quickStashPrimary,
  },
  {
    id: 3,
    title: 'Share from Any App',
    subtitle: 'Save links from anywhere',
    description: 'Share URLs from your browser, social media, or any app directly to QuickStash. No more switching between apps!',
    image: require('~/assets/images/onboarding/tabs.png'),
    icon: 'share-variant',
    color: theme.colors.quickStashPrimary,
  },
  {
    id: 4,
    title: 'Works Offline',
    subtitle: 'Access your saves anywhere',
    description: 'Your saved links are available even when you\'re offline. Changes sync automatically when you\'re back online.',
    image: require('~/assets/images/onboarding/offline.png'),
    icon: 'wifi-off',
    color: theme.colors.quickStashPrimary,
  },
  {
    id: 5,
    title: 'Ready to Get Started?',
    subtitle: 'Let\'s begin your journey',
    description: 'You\'re all set! Start saving your first URL and experience the power of QuickStash.',
    image: require('~/assets/logo-splash.png'),
    icon: 'rocket-launch',
    color: theme.colors.accent.DEFAULT,
  },
];

const OnboardingScreens: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const canSkip = currentIndex >= 2;

  const handleNext = () => {
    if (currentIndex < onboardingScreens.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateX.value = withSpring(-(currentIndex + 1) * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 90,
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      translateX.value = withSpring(-(currentIndex - 1) * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 90,
      });
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await setOnboardingCompleted();
    router.replace('/(auth)');
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const threshold = SCREEN_WIDTH * 0.3;
      
      if (event.translationX > threshold && currentIndex > 0) {
        // Swipe right - go to previous
        runOnJS(handlePrevious)();
      } else if (event.translationX < -threshold && currentIndex < onboardingScreens.length - 1) {
        // Swipe left - go to next
        runOnJS(handleNext)();
      } else {
        // Snap back to current position
        translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, {
          damping: 20,
          stiffness: 90,
        });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderScreen = (screen: OnboardingScreen, index: number) => {
    return (
      <View key={screen.id} style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          {/* Skip Button - Fixed at top */}
          {canSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipText, { color: screen.color }]}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Scrollable Content */}
          <View style={styles.contentWrapper}>
            {/* Image Container */}
            <View style={styles.imageContainer}>
              <Image
                source={screen.image}
                style={screen.id === 5 ? { width: 150, height: 150 } : styles.image }
                resizeMode="contain"
              />
            </View>
            {/* Content */}
            <View style={styles.textContainer}>
              <View style={[styles.iconContainer, { backgroundColor: screen.color }]}>
                <MaterialCommunityIcons
                  name={screen.icon as any}
                  size={40}
                  color="white"
                />
              </View>
              
              <Text style={[styles.title, { color: screen.color }]}>{screen.title}</Text>
              <Text style={[styles.subtitle, { color: screen.color }]}>{screen.subtitle}</Text>
              <Text style={styles.description}>{screen.description}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  const currentScreen = onboardingScreens[currentIndex];

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.screensContainer, animatedStyle]}>
          {onboardingScreens.map((screen, index) => renderScreen(screen, index))}
        </Animated.View>
      </PanGestureHandler>

      {/* Fixed Navigation at Bottom */}
      <SafeAreaView style={styles.fixedNavigation}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingScreens.map((screen, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? currentScreen.color : '#D1D5DB',
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.previousButton, { borderColor: currentScreen.color }]}
              onPress={handlePrevious}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={currentScreen.color} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: currentScreen.color }]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingScreens.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <MaterialCommunityIcons 
              name={currentIndex === onboardingScreens.length - 1 ? 'rocket-launch' : 'chevron-right'} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  screensContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * onboardingScreens.length,
    height: SCREEN_HEIGHT,
  },
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 180,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  image: {
    width: 300,
    height: 300,
  },
  textContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  fixedNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BACKGROUND_COLOR,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.2s ease',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  previousButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 140,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default OnboardingScreens;
