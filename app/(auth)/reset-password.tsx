import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Header from "~/components/header";
import Button from "~/components/Button";
import Label from "~/components/Label";
import FormField from "~/components/FormField";
import Input from "~/components/Input";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "~/constants/supabase";

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const { access_token, refresh_token, type } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({
    type: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);

  // Check if the deep link is valid and set session
  useEffect(() => {
    const handleDeepLinkSession = async () => {
      if (type === 'recovery' && access_token && refresh_token) {
        try {
          // Set the session with the tokens from the deep link
          const { data, error } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (error) {
            console.log('~ 🚀: Failed to set session from deep link:', error.message);
            setMessage({
              type: "error",
              message: "Invalid or expired reset link. Please request a new password reset.",
            });
            return;
          }

          console.log('~ 🚀: Session set successfully from deep link');
          setIsValidLink(true);
        } catch (err) {
          console.error('~ 🚀: Error setting session from deep link:', err);
          setMessage({
            type: "error",
            message: "Invalid or expired reset link. Please request a new password reset.",
          });
        }
      } else {
        setMessage({
          type: "error",
          message: "Invalid or expired reset link. Please request a new password reset.",
        });
      }
    };

    handleDeepLinkSession();
  }, [access_token, refresh_token, type]);

  const handleResetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage({
        type: "error",
        message: "Please fill in all fields",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        message: "Passwords do not match",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", message: "" });

    try {
      const { error } = await updatePassword(formData.newPassword);
      if (error) {
        setMessage({
          type: "error",
          message: error.message || "Failed to update password",
        });
        setLoading(false);
        return;
      }

      setMessage({
        type: "success",
        message: "Password updated successfully! Redirecting to sign in...",
      });

      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.replace("/(auth)/signin");
      }, 2000);
    } catch (err: any) {
      setMessage({
        type: "error",
        message: err.message || "Failed to update password",
      });
    }
    setLoading(false);
  };

  if (!isValidLink) {
    return (
      <View className="bg-white flex-1">
        <SafeAreaView />
        <Header title="Reset Password" variant="detail" />

        <ScrollView
          className="rounded-t-[35px] flex-1 bg-background2 flex flex-col space-y-4 p-8 mt-4 w-full"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex flex-1 flex-col justify-center items-center space-y-4 w-full">
            <Text className="text-lg font-psemibold text-red-600 text-center">
              Invalid Reset Link
            </Text>
            <Text className="text-sm font-pregular text-accent text-center">
              This password reset link is invalid or has expired.
            </Text>
            <Text className="text-sm font-pregular text-accent text-center">
              Please request a new password reset from the sign-in screen.
            </Text>

            <Button
              text="Go to Sign In"
              variant="default"
              className="w-full mt-6"
              textProps={{ className: "text-white" }}
              onPress={() => router.replace("/(auth)/signin")}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="bg-white flex-1">
      <SafeAreaView />
      <Header title="Reset Password" variant="detail" />

      <ScrollView
        className="rounded-t-[35px] flex-1 bg-background2 flex flex-col space-y-4 p-8 mt-4 w-full"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex flex-1 flex-col justify-start space-y-4 w-full">
          <Text className="text-lg font-psemibold text-accent text-center mb-2">
            Set New Password
          </Text>
          <Text className="text-sm font-pregular text-accent text-center mb-6">
            Enter your new password below
          </Text>

          <FormField>
            <Label text="New Password" />
            <Input
              variant="primary"
              value={formData.newPassword}
              onChange={(value: string) =>
                setFormData({ ...formData, newPassword: value })
              }
              placeholder="Enter new password"
              type="password"
              disabled={loading}
            />
          </FormField>

          <FormField>
            <Label text="Confirm Password" />
            <Input
              variant="primary"
              value={formData.confirmPassword}
              onChange={(value: string) =>
                setFormData({ ...formData, confirmPassword: value })
              }
              placeholder="Confirm new password"
              type="password"
              disabled={loading}
            />
          </FormField>

          {message.type === "error" && message.message && (
            <Text className="text-[16px] font-pregular text-red-600">
              {message.message}
            </Text>
          )}

          {message.type === "success" && message.message && (
            <Text className="text-[16px] font-pregular text-green-600">
              {message.message}
            </Text>
          )}

          <Button
            text="Update Password"
            loading={loading}
            variant="default"
            className="w-full"
            textProps={{ className: "text-white" }}
            onPress={handleResetPassword}
          />

          <View className="flex flex-row items-center gap-x-1 mt-2 justify-center space-x-1">
            <Text className="text-sm text-gray-600 font-pregular">
              Remember your password?
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/(auth)/signin")}
            >
              <Text className="text-sm underline text-primary font-psemibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ResetPassword;
