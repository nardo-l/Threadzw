import React, { createContext, useContext } from 'react';
import { useShop } from '../hooks/useShop';

interface ShopContextType {
  shop: any | null;
  loading: boolean;
  hasShop: boolean;
  refreshShop: () => Promise<void>;
  authLoading?: boolean;
  setShop: (shop: any | null) => void;
  setHasShop: (hasShop: boolean) => void;
  setLoading: (loading: boolean) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shopData = useShop();

  return (
    <ShopContext.Provider value={shopData}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShopContext = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShopContext must be used within a ShopProvider');
  }
  return context;
};
