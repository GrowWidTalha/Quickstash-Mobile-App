import React from "react";
import { Image, Text, View } from "react-native";
// import { UserResource } from "@clerk/types";

interface ProfileHeaderProps {
  user: any;
  userData: any;
}

const ProfileHeader = ({ user, userData }: ProfileHeaderProps) => {
  return (
    <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
      <View className="flex-row items-center">
        <Image
          source={
            user?.featured_image_url
              ? { uri: user.featured_image_url }
              : require("../assets/images/placeholder.jpg")
          }
          className="w-20 h-20 rounded-2xl bg-gray-100"
        />
        <View className="ml-4 flex-1">
          <Text className="text-lg font-pmedium text-accent">
            {userData
              ? `${userData.firstName || ""} ${
                  userData.lastName || ""
                }`.trim() || "Your Name"
              : "Your Name"}
          </Text>
          <Text className="text-gray-500">
            {userData?.email || user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;