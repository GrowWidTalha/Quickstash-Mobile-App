import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useShareIntent } from "expo-share-intent";

interface ShareIntentContextType {
  sharedUrl: string | null;
  isShareIntentVisible: boolean;
  hideShareIntent: () => void;
  clearSharedUrl: () => void;
}

const ShareIntentContext = createContext<ShareIntentContextType | undefined>(
  undefined
);

export const useCustomShareIntent = () => {
  const context = useContext(ShareIntentContext);
  if (!context) {
    throw new Error(
      "useCustomShareIntent must be used within a ShareIntentProvider"
    );
  }
  return context;
};

export const ShareIntentProvider = ({ children }: { children: ReactNode }) => {
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [isShareIntentVisible, setIsShareIntentVisible] = useState(false);

  useEffect(() => {
    if (hasShareIntent && shareIntent?.webUrl) {
      // expo-share-intent returns an object, usually { type, data, ... }
      // data contains the shared URL or text
      setSharedUrl(shareIntent.webUrl);
      setIsShareIntentVisible(true);
    }
  }, [hasShareIntent, shareIntent]);

  const hideShareIntent = () => {
    setIsShareIntentVisible(false);
  };

  const clearSharedUrl = () => {
    setSharedUrl(null);
    setIsShareIntentVisible(false);
    resetShareIntent(); // clear state in expo-share-intent hook
  };

  const contextValue: ShareIntentContextType = {
    sharedUrl,
    isShareIntentVisible,
    hideShareIntent,
    clearSharedUrl,
  };

  return (
    <ShareIntentContext.Provider value={contextValue}>
      {children}
    </ShareIntentContext.Provider>
  );
};
