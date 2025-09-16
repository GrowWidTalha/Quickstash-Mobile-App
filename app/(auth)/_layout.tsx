import { Redirect, router, Stack } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "~/contexts/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useAuth();


  useEffect(() => {
    if(!loading && user){
      router.push("/(tabs)/home")
    }
  }, [user, loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
    </Stack>
  );
}