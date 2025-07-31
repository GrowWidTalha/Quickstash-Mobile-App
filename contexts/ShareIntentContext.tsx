import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

interface ShareIntentContextType {
  sharedUrl: string | null;
  isShareIntentVisible: boolean;
  showShareIntent: (url: string) => void;
  hideShareIntent: () => void;
  clearSharedUrl: () => void;
}

const ShareIntentContext = createContext<ShareIntentContextType | undefined>(undefined);

export const useShareIntent = () => {
  const context = useContext(ShareIntentContext);
  if (!context) {
    throw new Error('useShareIntent must be used within a ShareIntentProvider');
  }
  return context;
};

export const ShareIntentProvider = ({ children }: { children: ReactNode }) => {
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [isShareIntentVisible, setIsShareIntentVisible] = useState(false);

  // Handle initial URL when app is opened via share intent
  useEffect(() => {
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          processSharedURL(initialURL);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    handleInitialURL();
  }, []);

  // Handle URL changes when app is already running
  useEffect(() => {
    const handleURLChange = (event: { url: string }) => {
      processSharedURL(event.url);
    };

    const subscription = Linking.addEventListener('url', handleURLChange);
    return () => subscription?.remove();
  }, []);

  const processSharedURL = (url: string) => {
    try {
      // Parse the URL to extract the shared content
      const parsedUrl = new URL(url);
      
      // Handle different URL schemes
      if (parsedUrl.protocol === 'com.quickstash.app:') {
        // Custom scheme - extract URL from query params
        const sharedUrlParam = parsedUrl.searchParams.get('url');
        if (sharedUrlParam) {
          showShareIntent(decodeURIComponent(sharedUrlParam));
        }
      } else if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        // Direct URL sharing
        showShareIntent(url);
      }
    } catch (error) {
      console.error('Error processing shared URL:', error);
    }
  };

  const showShareIntent = (url: string) => {
    setSharedUrl(url);
    setIsShareIntentVisible(true);
  };

  const hideShareIntent = () => {
    setIsShareIntentVisible(false);
  };

  const clearSharedUrl = () => {
    setSharedUrl(null);
    setIsShareIntentVisible(false);
  };

  const contextValue: ShareIntentContextType = {
    sharedUrl,
    isShareIntentVisible,
    showShareIntent,
    hideShareIntent,
    clearSharedUrl,
  };

  return (
    <ShareIntentContext.Provider value={contextValue}>
      {children}
    </ShareIntentContext.Provider>
  );
}; 