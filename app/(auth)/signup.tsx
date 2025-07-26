import {
  Alert,
  Dimensions,
  Image,
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

const { width } = Dimensions.get("window");

const SignUp = () => {
  const { signUp } = useAuth();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({
    type: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setMessage({ type: "", message: "" });
    try {
      const { error } = await signUp(credentials.email, credentials.password);
      if (error) {
        setMessage({
          type: "error",
          message: error.message || "Error signing up",
        });
        setLoading(false);
        return;
      }
      // Redirect to sign in or home after successful sign up
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setMessage({
        type: "error",
        message: err.message || "Error signing up",
      });
      setLoading(false);
    }
  };

  return (
    <View className="bg-white flex-1">
      <SafeAreaView />
      <Header title="Register" variant="detail" />

      <ScrollView
        className="rounded-t-[35px] flex-1 bg-background2 flex flex-col space-y-4 p-8 mt-4 w-full"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex flex-1 flex-col  justify-start space-y-4 w-full">
          <FormField>
            <Label text="Email" />
            <Input
              variant="primary"
              value={credentials.email}
              onChange={(value: string) =>
                setCredentials({ ...credentials, email: value })
              }
              placeholder="eg. mail@example.com"
              type="email"
              disabled={loading}
            />
          </FormField>

          <FormField>
            <Label text="Password" />
            <Input
              variant="primary"
              value={credentials.password}
              onChange={(value: string) =>
                setCredentials({ ...credentials, password: value })
              }
              placeholder="********"
              type="password"
              disabled={loading}
            />
          </FormField>

          {message.type === "error" && message.message && (
            <Text className="text-[16px] font-pregular text-red-600">
              {message.message}
            </Text>
          )}

          <View className="gap-2 mt-2">
            <Button
              text="Sign Up"
              loading={loading}
              variant="default"
              className="w-full"
              textProps={{ className: "text-white" }}
              onPress={onSubmit}
            />

            <Text className="text-sm text-accent text-center font-pmedium">- OR -</Text>

            <Button
              text="Continue with Google"
              variant="outline"
              className="w-full"
              leftIcon={
                <Image
                  source={require("~/assets/icons/google.png")}
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              }
              onPress={() => {
                Alert.alert(
                  "Google OAuth",
                  "Your (Design Rehab) OAuth api request is being reviewed."
                );
              }}
            />
          </View>

          <View className="flex flex-row items-center gap-x-1 mt-2 justify-center space-x-1 mb-4">
            <Text className="text-sm text-gray-600 font-pregular">
              Already have an account?
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                router.replace("/(auth)/signin");
              }}
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

export default SignUp; 