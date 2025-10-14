import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "~/components/header";
import Button from "~/components/Button";
import { router } from "expo-router";
import Label from "~/components/Label";
import FormField from "~/components/FormField";
import Input from "~/components/Input";
import { useAuth } from "../../contexts/AuthContext";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
  });
  const [message, setMessage] = useState({
    type: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    if (!formData.email) {
      setMessage({
        type: "error",
        message: "Please enter your email address",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", message: "" });

    try {
      const { error } = await resetPassword(formData.email);
      if (error) {
        setMessage({
          type: "error",
          message: error.message || "Failed to send reset link",
        });
        setLoading(false);
        return;
      }

      setMessage({
        type: "success",
        message: "Password reset link sent! Check your email and click the link to reset your password.",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        message: err.message || "Failed to send reset link",
      });
    }
    setLoading(false);
  };

  return (
    <View className="bg-white flex-1">
      <SafeAreaView />
      <Header title="Forgot Password" variant="detail" />

      <ScrollView
        className="rounded-t-[35px] flex-1 bg-background2 flex flex-col space-y-4 p-8 mt-4 w-full"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex flex-1 flex-col justify-start space-y-4 w-full">
          <Text className="text-lg font-psemibold text-accent text-center mb-2">
            Reset Your Password
          </Text>
          <Text className="text-sm font-pregular text-accent text-center mb-6">
            Enter your email address and we'll send you a password reset link
          </Text>

          <FormField>
            <Label text="Email" />
            <Input
              variant="primary"
              value={formData.email}
              onChange={(value: string) =>
                setFormData({ ...formData, email: value })
              }
              placeholder="eg. mail@example.com"
              type="email"
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
            text="Send Reset Link"
            loading={loading}
            variant="default"
            className="w-full"
            textProps={{ className: "text-white" }}
            onPress={handleSendResetLink}
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

export default ForgotPassword; 