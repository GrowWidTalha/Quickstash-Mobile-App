import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChevronRightIcon } from "react-native-heroicons/outline";
import { useRouter } from "expo-router";
import theme from "~/constants/theme";

interface ProfileItem {
  id?: string;
  title: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route?: string;
  modalProps?: any;
}

interface ProfileSectionProps {
  title: string;
  items: ProfileItem[];
  onModalOpen?: (id: string) => void;
}

const ProfileSection = ({ title, items, onModalOpen }: ProfileSectionProps) => {
  const router = useRouter();

  return (
    <View className="mb-6">
      <Text className="text-lg font-pmedium text-accent mb-3">{title}</Text>
      <View className="bg-white rounded-3xl overflow-hidden shadow-sm">
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            onPress={() =>
              item.modalProps
                ? onModalOpen?.(item.id as string)
                // @ts-ignore
                : router.push(item?.route as string)
            }
            className={`flex-row items-center p-4 ${
              index !== items.length - 1 ? "border-b border-gray-100" : ""
            }`}
            activeOpacity={0.7}
          >
            <View className="bg-accent/10 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={theme.colors.accent.DEFAULT}
              />
            </View>
            <View className="flex-1">
              <Text className="text-accent font-pmedium">{item.title}</Text>
              {item.value && <Text className="text-gray-500 text-sm font-pregular">
                {item.value}
              </Text>}
            </View>
            <ChevronRightIcon size={20} color={theme.colors.accent.DEFAULT} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ProfileSection;