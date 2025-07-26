import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StashDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const StashDrawerContext = createContext<StashDrawerContextType | undefined>(undefined);

export const useStashDrawer = () => {
  const context = useContext(StashDrawerContext);
  if (!context) {
    throw new Error('useStashDrawer must be used within a StashDrawerProvider');
  }
  return context;
};

export const StashDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const toggleDrawer = () => setIsOpen((prev) => !prev);

  return (
    <StashDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </StashDrawerContext.Provider>
  );
}; 