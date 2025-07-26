import { View, ViewProps } from "react-native";
import Input from "./Input";
import Label from "./Label";
import { cn } from "~/lib/utils";

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  props?: ViewProps;
}

const FormField = ({ children, className, ...props }: FormFieldProps) => {
  return (
    <View
      className={cn(
        "flex flex-col space-y-2 items-start justify-start",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
};

export default FormField;