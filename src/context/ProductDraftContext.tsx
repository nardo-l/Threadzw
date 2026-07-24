import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ProductDraft {
  name: string;
  description: string;
  category: string;
  images: string[];
  sizes: Record<string, { active: boolean; stock: number }>;
  colours: string[];
  price: string;
  brand: string;
  material: string;
  gender: string;
  condition: string;
  features: string;
  careInstructions: string;
}

interface ProductDraftContextType {
  draft: ProductDraft;
  updateDraft: (updates: Partial<ProductDraft>) => void;
  resetDraft: () => void;
}

const initialDraft: ProductDraft = {
  name: '',
  description: '',
  category: 'Tops',
  images: [],
  sizes: {},
  colours: ['Midnight Black'],
  price: '29.99',
  brand: '',
  material: '',
  gender: 'Unisex',
  condition: 'New',
  features: '',
  careInstructions: ''
};

const ProductDraftContext = createContext<ProductDraftContextType | undefined>(undefined);

export const ProductDraftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<ProductDraft>(initialDraft);

  const updateDraft = (updates: Partial<ProductDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const resetDraft = () => {
    setDraft(initialDraft);
  };

  return (
    <ProductDraftContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </ProductDraftContext.Provider>
  );
};

export const useProductDraft = () => {
  const context = useContext(ProductDraftContext);
  if (!context) {
    throw new Error('useProductDraft must be used within a ProductDraftProvider');
  }
  return context;
};
