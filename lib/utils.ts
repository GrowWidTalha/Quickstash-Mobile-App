import { type ClassValue, clsx } from "clsx";
import { Linking } from "react-native";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ATSImageHandler = (imageUrl: string) => {
  if (imageUrl.startsWith("http://")) {
    return imageUrl.replace("http://", "https://");
  }
  return imageUrl;
};

export const openExternalUrl = (url: string) => {
  if (url && url !== "" && url !== null) {
    Linking.canOpenURL(url).then((supported: any) => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  }
};

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function locationExtractor(item: any) {
  if (!item.long || !item.lat) return null;
  return {
    address: item.address,
    city: item.city,
    state: item.state,
    country: item.country,
    zipCode: item.zipCode,
    long: item.long,
    lat: item.lat,
  };
}
export const capitalize = (
  str: string | undefined | null,
  mode: "first" | "all" = "first"
) => {
  if (!str) return "";
  if (mode === "first") {
    return str.charAt(0).toUpperCase() + str.slice(1);
  } else {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
};

export const errorMessageHandler = (
  text: string | undefined | null,
  defaultMessage: string = "Something went wrong"
) => {
  if (!text) return defaultMessage;
  return text.length > 35 ? defaultMessage : text;
};

export const formatCurrency = (amount: number, currency = "CAD") => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};