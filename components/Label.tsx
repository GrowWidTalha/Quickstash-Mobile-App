import { Text, View } from "react-native";
import { cn } from "~/lib/utils";

interface LabelProps {
  text: string;
  className?: string;
  error?: boolean;
  isRequired?: boolean;
}

const Label = ({ text, className, error, isRequired = false }: LabelProps) => {
  return (
    <View className="flex-row items-center space-x-1">
      <Text
        className={cn(
          "text-[15px] font-pregular text-left",
          error ? "text-error" : "text-base2",
          className
        )}
      >
        {text}
      </Text>
      {isRequired && (
        <Text className={cn("text-[15px] font-pregular text-left text-error")}>
          *
        </Text>
      )}
    </View>
  );
};

export default Label;