import React, { useEffect, useState } from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";
import * as Progress from "react-native-progress";
import theme from "~/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineDebugger } from "~/components/OfflineDebugger";
import { hasCompletedOnboarding } from "~/lib/onboardingStorage";

const Splash = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, loading, sessionLoaded } = useAuth();
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [hasCachedUser, setHasCachedUser] = useState(false);
  const [showOfflineError, setShowOfflineError] = useState(false);
  const [debugOfflineMode, setDebugOfflineMode] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check network and cached data on mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // If debug mode is on, override with false (offline)
      const actualOnline = state.isConnected ?? true;
      setIsOnline(debugOfflineMode ? false : actualOnline);
    });
    
    // Check for cached user data and onboarding status
    (async () => {
      try {
        const cachedUserRaw = await AsyncStorage.getItem('offline_last_user');
        const cachedUserId = await AsyncStorage.getItem('offline_user_id');
        setHasCachedUser(!!(cachedUserRaw && cachedUserId));
        
        // Check onboarding status
        const completed = await hasCompletedOnboarding();
        setOnboardingCompleted(completed);
      } catch (e) {
        console.warn('Failed to check cached user or onboarding status', e);
        setOnboardingCompleted(false);
      }
    })();
    
    return () => {
      setIsMounted(false);
      unsubscribe();
    };
  }, [debugOfflineMode]);

  // Handler to toggle debug offline mode
  const handleToggleDebugOffline = () => {
    setDebugOfflineMode(!debugOfflineMode);
    // Update isOnline state immediately
    setIsOnline(debugOfflineMode); // Will be opposite of current debug mode
  };

  useEffect(() => {
    if (sessionLoaded && !loading && isMounted && onboardingCompleted !== null) {
      // Add a delay to show the splash screen for a bit longer
      setTimeout(() => {
        if (!isMounted) return;
        setIsUnmounting(true);
        setTimeout(() => {
          if (!isMounted) return;
          
          // Check if onboarding needs to be shown first
          if (!onboardingCompleted) {
            console.log('~ 🚀: Onboarding not completed, showing onboarding');
            router.replace("/(onboarding)");
            return;
          }
          
          // User is authenticated (from online session or offline cache)
          if (user) {
            console.log('~ 🚀: User found, navigating to home');
            router.replace("/(tabs)/home");
          } 
          // No user but offline with cached user data
          else if (!isOnline && hasCachedUser) {
            console.log('~ 🚀: Offline with cached user, navigating to home');
            router.replace("/(tabs)/home");
          }
          // No user and offline without cached data - show error
          else if (!isOnline && !hasCachedUser) {
            console.log('~ 🚀: Offline without cached user, showing error');
            setShowOfflineError(true);
          }
          // Online without user - go to auth
          else {
            console.log('~ 🚀: No user, navigating to auth');
            router.replace("/(auth)");
          }
        }, 0);
      }, 1200); // Show splash for 1.2 seconds after loading
    }
  }, [sessionLoaded, loading, user, isMounted, isOnline, hasCachedUser, onboardingCompleted]);

  // Handler to retry connection
  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    const online = state.isConnected ?? false;
    setIsOnline(online);
    
    if (online) {
      setShowOfflineError(false);
      // Reload the app to fetch session
      router.replace("/");
    }
  };

  // Show offline error screen
  if (showOfflineError) {
    return (
      <View className="bg-white flex-1">
        <SafeAreaView />
        <View className="flex-1 space-y-6 flex items-center justify-center p-5">
          <Image
            source={require("~/assets/logo-splash.png")}
            style={{
              width: 120,
              height: 120,
            }}
          />
          
          <View className="space-y-3 items-center max-w-sm">
            <Text className="text-gray-800 text-xl font-pbold text-center">
              You're Offline
            </Text>
            <Text className="text-gray-600 text-base font-pregular text-center">
              Please connect to the internet to sign in to your account.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRetry}
            className="bg-accent-100 px-8 py-3 rounded-lg mt-4"
          >
            <Text className="text-white font-pmedium text-base">
              Retry Connection
            </Text>
          </TouchableOpacity>

          <Text className="text-accent-100 mt-8 text-sm font-pregular">
            © QuickStash 2025
          </Text>
        </View>
        
        {/* Debug Tool */}
        <OfflineDebugger 
          debugOfflineMode={debugOfflineMode}
          onToggleOffline={handleToggleDebugOffline}
        />
      </View>
    );
  }

  // Conditional rendering based on loading and unmounting states
  if (loading || !sessionLoaded) {
    return (
      <View className="bg-white flex-1">
        <SafeAreaView />
        <View className="flex-1 space-y-10 flex items-center justify-center relative p-5">
          <Image
            source={require("~/assets/logo-splash.png")}
            style={{
              width: 150,
              height: 150,
            }}
          />

          <View className="flex flex-col space-y-5 items-center justify-center absolute bottom-10">
            <View className="animate-spin">
              <Progress.Circle
                size={30}
                borderWidth={1.2}
                indeterminate={true}
                color={theme.colors.accent[100]}
              />
            </View>
            <Text className="text-accent-100 mt-2 text-sm font-pregular">
              © QuickStash 2025
            </Text>
          </View>
        </View>
        
        {/* Debug Tool */}
        <OfflineDebugger 
          debugOfflineMode={debugOfflineMode}
          onToggleOffline={handleToggleDebugOffline}
        />
      </View>
    );
  }

  if (isUnmounting || !isMounted) {
    return null;
  }

  return (
    <View className="bg-white flex-1">
      <SafeAreaView />
      <View className="flex-1 space-y-10 flex items-center justify-center relative p-5">
        <Image
          source={require("~/assets/logo-splash.png")}
          style={{
            width: 150,
            height: 150,
          }}
        />

        <View className="flex flex-col space-y-5 items-center justify-center absolute bottom-10">
          <View className="animate-spin">
            <Progress.Circle
              size={30}
              borderWidth={1.2}
              indeterminate={true}
              color={theme.colors.accent[100]}
            />
          </View>
          <Text className="text-accent-100 mt-2 text-sm font-pregular">
            © QuickStash 2025
          </Text>
        </View>
      </View>
      
      {/* Debug Tool */}
      <OfflineDebugger 
        debugOfflineMode={debugOfflineMode}
        onToggleOffline={handleToggleDebugOffline}
      />
    </View>
  );
};

export default Splash;