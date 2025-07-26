import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { VariantProps, cva } from "class-variance-authority";
import { cn } from "~/lib/utils";
import * as Progress from "react-native-progress";
import theme from "~/constants/theme";

export const buttonVariants = cva(
  "py-[15px] px-4 rounded-2xl flex flex-row items-center justify-between space-x-2 border-[1px]",
  {
    variants: {
      variant: {
        default: "bg-primary border-primary",
        outline: " border-neutral bg-neutral",
        destructive: "bg-error border-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const buttonTextVariants = cva("text-md font-pmedium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      outline: "text-accent",
      destructive: "text-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface ButtonProps {
  text: string;
  className?: string;
  variant?: "default" | "outline" | "destructive" | null | undefined;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  textProps?: any;
  loading?: boolean;
  style?: any;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  text,
  className,
  variant,
  leftIcon = <View className="w-6 h-6"></View>,
  rightIcon = <View className="w-6 h-6"></View>,
  onPress = () => null,
  textProps: { className: textClassName, ...textProps } = {},
  loading = false,
  disabled = false,
  style = {},
  ...props
}: ButtonProps) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "outline":
        return "bg-transparent border border-accent";
      case "destructive":
        return "bg-red-500";
      default:
        return "bg-accent";
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "outline":
        return "text-accent";
      case "destructive":
        return "text-white";
      default:
        return "text-white";
    }
  };

  return (
    <TouchableOpacity
      className={`${buttonVariants({ variant })} ${
        loading || disabled ? "opacity-60" : ""
      }`}
      activeOpacity={0.6}
      onPress={() => (loading || disabled ? null : onPress())}
      disabled={loading || disabled}
      style={style}
      {...props}
    >
      {leftIcon}
      {loading ? (
        <View className={`flex flex-row items-center justify-center space-x-3`}>
          <Progress.Circle
            size={20}
            borderWidth={2}
            indeterminate={true}
            color={
              variant === "default"
                ? theme.colors.primary.foreground
                : variant === "outline"
                ? theme.colors.accent.DEFAULT
                : theme.colors.accent.foreground
            }
          />
          <Text
            className={cn(buttonTextVariants({ variant }), textClassName)}
            {...textProps}
          >
            {text}
          </Text>
        </View>
      ) : (
        <Text
          className={cn(buttonTextVariants({ variant }), textClassName)}
          {...textProps}
        >
          {text}
        </Text>
      )}
      {rightIcon}
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({});