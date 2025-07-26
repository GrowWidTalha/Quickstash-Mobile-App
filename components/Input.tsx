import {
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from "react-native";
  import DateTimePickerModal from "react-native-modal-datetime-picker";
  import moment from "moment";
  import React from "react";
  import theme from "~/constants/theme";
  import {
    ClockIcon,
    EyeIcon,
    EyeSlashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
  } from "react-native-heroicons/outline";
  import { cva } from "class-variance-authority";
  import { cn } from "~/lib/utils";
  
  // Input variants remain the same
  export const inputVariants = cva(
    "w-full flex flex-row justify-center items-center space-x-4 px-5 py-1 rounded-2xl",
    {
      variants: {
        variant: {
          default: "bg-[#D9D9D9]/30",
          primary: "bg-neutral",
          outline: "bg-transparent border-[1px] border-primary",
          error: "bg-error/10 border-[1px] border-error",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  );
  
  export const inputTextVariants = cva("text-sm font-pregular", {
    variants: {
      variant: {
        default: "text-accent",
        primary: "text-accent",
        outline: "text-primary",
        error: "text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });
  
  interface InputProps {
    type?:
      | "textArea"
      | "text"
      | "password"
      | "email"
      | "search"
      | "number"
      | "tel";
    value?: string;
    onChange?: (value: any) => void;
    placeholder?: string;
    inputClassName?: string;
    variant?: "default" | "primary" | "outline" | "error";
    size?: "default" | "sm" | "lg";
    inputProps?: any;
    className?: string;
    style?: any;
    readonly?: boolean;
    disabled?: boolean;
    error?: boolean;
  }
  
  const Input = ({
    type = "text",
    value = "",
    onChange = (value: any) => null,
    placeholder,
    inputClassName,
    variant,
    inputProps,
    className,
    style,
    readonly = false,
    disabled = false,
    error = false,
  }: InputProps) => {
    const inputRef = React.useRef<any>(null);
    const [isPassword, setIsPassword] = React.useState(false);
  
    const currentVariant = error ? "error" : variant;
  
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 1.0 : 1.0 }]}
        onPress={() =>
          !disabled &&
          type !== "textArea" &&
          (inputRef ? inputRef.current.focus() : null)
        }
      >
        <View
          className={cn(
            inputVariants({ variant: currentVariant }),
            disabled ? "opacity-80" : "",
            type === "textArea" && "rounded-2xl",
            className
          )}
          style={[
            {
              minHeight: type === "textArea" ? 120 : undefined,
              maxHeight: type === "textArea" ? 220 : undefined,
              alignItems: type === "textArea" ? "flex-start" : "center",
              paddingVertical: type === "textArea" ? 8 : undefined,
            },
            style,
          ]}
        >
          {type === "search" && (
            <View className="flex items-center justify-center">
              <MagnifyingGlassIcon
                color={theme.colors.foreground}
                size={20}
                opacity={0.6}
                strokeWidth={2}
              />
            </View>
          )}
  
          <TextInput
            ref={inputRef}
            multiline={type === "textArea"}
            numberOfLines={type === "textArea" ? 4 : 1}
            textAlignVertical={type === "textArea" ? "top" : "center"}
            autoCapitalize={
              type === "password" || type === "email" || type === "search"
                ? "none"
                : undefined
            }
            autoCorrect={type === "password" ? true : undefined}
            secureTextEntry={type === "password" && !isPassword}
            inputMode={
              type === "number"
                ? "numeric"
                : type === "search"
                ? "search"
                : type === "email"
                ? "email"
                : type === "tel"
                ? "tel"
                : "text"
            }
            textContentType={type === "textArea" ? "none" : type}
            className={cn(
              inputTextVariants({ variant: currentVariant }),
              type === "textArea"
                ? "flex-1 min-h-[100px] py-3"
                : "flex-1 h-[45px]",
              inputClassName
            )}
            style={
              type === "textArea"
                ? {
                    minHeight: 100,
                    maxHeight: 200,
                    paddingTop: 12,
                    paddingBottom: 12,
                  }
                : undefined
            }
            value={value}
            selectionColor={theme.colors.primary.DEFAULT}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.neutral["900"]}
            onChangeText={onChange}
            editable={!disabled}
            {...inputProps}
          />
  
          {type === "password" ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ height: 40, width: 40 }}
              className={`flex items-center justify-center -mr-[10px] ${
                disabled ? "opacity-50" : ""
              }`}
              onPress={() => !disabled && setIsPassword(!isPassword)}
              disabled={disabled}
            >
              {!isPassword ? (
                <EyeSlashIcon
                  color={theme.colors.foreground}
                  size={20}
                  opacity={0.6}
                  strokeWidth={2}
                />
              ) : (
                <EyeIcon
                  color={theme.colors.foreground}
                  size={20}
                  opacity={0.6}
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>
          ) : type === "search" && value && value.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onChange("")}
              className="flex items-center justify-center"
            >
              <XMarkIcon
                color={theme.colors.foreground}
                size={20}
                opacity={0.6}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </Pressable>
    );
  };
  
  export const TimePickerInput = ({
    label,
    type = "text",
    value = "",
    onChange = (value: any) => null,
    placeholder,
    inputClassName,
    inputProps,
    className,
    style,
    disabled = false,
    ...props
  }: any) => {
    const inputRef = React.useRef<any>(null);
    const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  
    return (
      <Pressable
        style={{
          marginTop: -15,
          marginBottom: -50,
        }}
        onPress={() => !disabled && setIsPickerOpen(true)}
      >
        <View className={`flex flex-col space-y-2`} style={[style]}>
          {label ? (
            <Text className="text-[15px] font-psemibold text-primary text-start">
              {label}
            </Text>
          ) : null}
          <View
            className={`flex flex-row space-x-4 px-5 py-0.5 bg-[#D9D9D9]/30 rounded-2xl ${className}`}
            style={[
              {
                height: 60,
                alignItems: "center",
              },
              style,
            ]}
            {...props}
          >
            <TextInput
              textContentType={"text"}
              className={`text-sm pt[4px] grow font-pregular ${inputClassName}`}
              value={moment(new Date(value)).format("hh:mm A") || ""}
              selectionColor={theme.colors.primary.DEFAULT}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.foreground}
              editable={false}
              style={{
                color: "black",
              }}
              {...inputProps}
            />
  
            <ClockIcon
              color={theme.colors.foreground}
              size={20}
              opacity={0.6}
              strokeWidth={2}
            />
          </View>
        </View>
        <View
          style={{
            height: 40,
            width: 40,
          }}
          className={`flex items-center justify-center -mr-[10px]`}
        >
          <DateTimePickerModal
            isVisible={isPickerOpen}
            mode="time"
            onConfirm={(time: any) => {
              onChange(time);
              setIsPickerOpen(false);
            }}
            onCancel={() => setIsPickerOpen(false)}
          />
        </View>
      </Pressable>
    );
  };
  
  export default Input;