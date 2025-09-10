import React, { useEffect, useState } from "react";
import { Text, View, Image } from "react-native";
import * as Progress from "react-native-progress";
import theme from "~/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

const Splash = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, loading, sessionLoaded } = useAuth();
  console.log(loading, user)
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (sessionLoaded && !loading && isMounted) {
      // Add a delay to show the splash screen for a bit longer
      setTimeout(() => {
        if (!isMounted) return;
        setIsUnmounting(true);
        setTimeout(() => {
          if (!isMounted) return;
          if (user) {
            console.log(user)
            router.replace("/(tabs)/home");
          } else {
            router.replace("/(auth)");
          }
        }, 0);
      }, 1200); // Show splash for 1.2 seconds after loading
    }
  }, [sessionLoaded, loading, user, isMounted]);

  // Conditional rendering based on loading and unmounting states
  if (loading || !sessionLoaded) {
    return (
      <View className="bg-white flex-1 items-center justify-center">
        <Text>Loading...</Text>
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
          source={require("~/assets/logo.png")}
          style={{
            width: 150,
            height: 150 ,
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
    </View>
  );
};

export default Splash;