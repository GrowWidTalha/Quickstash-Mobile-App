import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from "react-native";
  import React, { JSX, useEffect, useRef, useState } from "react";
  import {
    ChevronLeftIcon,
    MagnifyingGlassIcon,
  } from "react-native-heroicons/outline";
  import theme from "~/constants/theme";
  import { router } from "expo-router";
  
  const { height, width } = Dimensions.get("window");
  
  const Header = ({
    title,
    titleSuperScript,
    variant = "master",
    onBack,
    image = null,
    detailAction = <View style={{ width: 50, height: 50 }} />,
  }: {
    title: string;
    titleSuperScript?: string;
    variant: "master" | "detail";
    onBack?: () => any;
    image?: any;
    detailAction?: JSX.Element;
  }) => {
    const widthConsumedByElements =
      50 + (variant === "detail" ? 30 : 50 + 2 + 45) + (image ? 40 + 10 : 0);
  
    return (
      <>
        <View className="w-full flex flex-row items-center justify-between pt-4 pb-2 px-4">
          {variant === "detail" && (onBack || router.canGoBack()) ? (
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex items-start justify-center rounded-xl"
              style={{
                height: 50,
                width: 50,
              }}
              onPress={
                onBack
                  ? onBack
                  : router.canGoBack()
                  ? () => {
                      router.back();
                    }
                  : undefined
              }
            >
              <ChevronLeftIcon
                color={theme.colors.accent.DEFAULT}
                size={22}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
              }}
            />
          )}
  
          {image}
  
          <Text
            className="text-center text-[24px] font-pmedium"
            style={{
              color: theme.colors.accent.DEFAULT,
              textAlign: "center",
              fontSize: (() => {
                const maxFontSize = 22;
                const minFontSize = 2;
                const eachWordWidth = 15;
  
                const titleMaxWidth =
                  width - width * 2 * 0.05 - widthConsumedByElements - 20;
                const titleWidth = title.length * eachWordWidth;
  
                if (titleWidth > titleMaxWidth) {
                  // Calculate the new font size proportionally
                  const scaleFactor = titleMaxWidth / titleWidth;
                  const newFontSize = Math.floor(maxFontSize * scaleFactor);
  
                  // Ensure the font size doesn't go below the minimum font size
                  return Math.max(newFontSize, minFontSize);
                }
  
                return maxFontSize;
              })(),
  
              maxWidth: width - width * 2 * 0.05 - widthConsumedByElements - 20,
              overflow: "hidden",
            }}
          >
            {title.trim()}
            {titleSuperScript && (
              <View
                style={{
                  paddingLeft: 10,
                }}
              >
                <Text className="text-xs text-[12px] text-start">
                  {titleSuperScript}
                </Text>
              </View>
            )}
          </Text>
  
          {variant === "detail" ? (
            detailAction
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
              }}
            />
          )}
        </View>
      </>
    );
  };
  
  export const ChatBoxHeader = ({ title, image = null, onBack }: any) => {
    const widthConsumedByElements = 50 + 40 + 10 + 20;
  
    return (
      <>
        <View
          className="w-full flex flex-row items-center justify-start"
          style={[
            {
              marginTop: -(width * 0.05) + 10,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex items-start justify-center rounded-xl"
            style={{
              height: 50,
              width: 50,
            }}
            onPress={
              onBack
                ? onBack
                : router.canGoBack()
                ? () => {
                    router.back();
                  }
                : undefined
            }
          >
            <ChevronLeftIcon
              color={theme.colors.accent.DEFAULT}
              size={26}
              strokeWidth={2}
            />
          </TouchableOpacity>
  
          {image}
  
          <Text
            className="text-center pt-[6px] text-[24px] font-pregular truncate"
            style={{
              color: theme.colors.accent.DEFAULT,
              textAlign: "center",
              fontSize: 20,
              maxWidth: width - widthConsumedByElements,
            }}
          >
            {title.trim()}
          </Text>
        </View>
      </>
    );
  };
  
  export default Header;