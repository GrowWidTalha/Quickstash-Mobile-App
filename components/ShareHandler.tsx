import * as React from "react";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSaves } from "~/contexts/SavesContext";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "react-native-heroicons/outline";
import Button from "./ui/button";

interface ShareHandlerProps {
  isVisible: boolean;
  onClose: () => void;
  sharedUrl?: string;
}

export const ShareHandler: React.FC<ShareHandlerProps> = ({
  isVisible,
  onClose,
  sharedUrl,
}: ShareHandlerProps) => {
  const { addSave, isOnline } = useSaves();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isVisible && sharedUrl) {
      handleSharedUrl(sharedUrl);
    }
  }, [isVisible, sharedUrl]);

  const handleSharedUrl = async (url: string) => {
    setStatus("processing");
    setMessage("Saving your link...");

    try {
      if (!isValidUrl(url)) {
        setStatus("error");
        setMessage("Invalid URL format");
        return;
      }

      const result = await addSave(url);

      if (result.success) {
        setStatus("success");
        setMessage(isOnline ? "Link saved to Stash!" : "Saved locally — will sync when online.");
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to save link");
      }
    } catch {
      setStatus("error");
      setMessage("An unexpected error occurred");
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setMessage("");
    onClose();
  };

  const handleViewSaves = () => {
    handleClose();
    router.push("/(tabs)/home");
  };

  const getHeaderTitle = () => {
    switch (status) {
      case "processing":
        return "Saving Link...";
      case "success":
        return "Saved Successfully";
      case "error":
        return "Save Failed";
      default:
        return "Stash a URL";
    }
  };

  const getStatusIcon = () => {
    const circleStyle = "rounded-full p-3 mb-3";
    switch (status) {
      case "processing":
        return (
          <View className={`${circleStyle} bg-blue-100`}>
            <ActivityIndicator size={28} color="#1e3a8a" />
          </View>
        );
      case "success":
        return (
          <View className={`${circleStyle} bg-green-100`}>
            <CheckCircleIcon size={36} className="text-green-600" />
          </View>
        );
      case "error":
        return (
          <View className={`${circleStyle} bg-red-100`}>
            <XCircleIcon size={36} className="text-red-600" />
          </View>
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <Animated.View
          entering={FadeIn.springify().damping(15)}
          exiting={FadeOut}
          className="bg-white rounded-3xl shadow-md p-6 w-full max-w-sm border border-neutral-200"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-pmedium text-accent">{getHeaderTitle()}</Text>
            <TouchableOpacity onPress={handleClose} className="rounded-full p-1">
              <XCircleIcon size={24} className="text-gray-400" />
            </TouchableOpacity>
          </View>

          {/* Status Icon & Message */}
          <View className="items-center mb-4">
            {getStatusIcon()}
            <Text className="text-center text-gray-700 mt-1 font-pregular text-base min-h-[24px]">
              {message}
            </Text>
          </View>

          {/* Shared URL */}
          {sharedUrl && (
            <View className="bg-neutral-100 rounded-xl p-3 mb-4 border border-neutral-200">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-2">
                  <Text className="text-xs text-gray-500 mb-1 font-pregular">Shared URL</Text>
                  <Text
                    className="text-sm text-gray-800 font-mono"
                    numberOfLines={2}
                  >
                    {sharedUrl}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Offline Badge */}
          {!isOnline && status === "success" && (
            <View className="self-start mb-3">
              <View className="flex-row items-center bg-amber-100 px-3 py-1 rounded-full">
                <ExclamationTriangleIcon size={14} className="text-amber-600 mr-1" />
                <Text className="text-amber-700 text-xs font-pregular">
                  Saved offline, will sync later
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View className="gap-3 mt-2">
            {status === "success" && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Button variant="default" onPress={handleViewSaves} className="w-full">
                  View My Stashes
                </Button>
              </Animated.View>
            )}
            <Button
              variant={status === "success" ? "outline" : "default"}
              onPress={handleClose}
              className="w-full"
            >
              {status === "success" ? "Close" : "Retry"}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
