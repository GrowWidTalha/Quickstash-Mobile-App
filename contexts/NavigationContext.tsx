import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  direction: 'forward' | 'backward' | null;
  setDirection: (direction: 'forward' | 'backward' | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [direction, setDirection] = useState<'forward' | 'backward' | null>(null);

  return (
    <NavigationContext.Provider value={{ direction, setDirection }}>
      {children}
    </NavigationContext.Provider>
  );
};
