import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FollowContextType {
  followedShops: Set<string>;
  follow: (shopId: string) => Promise<void>;
  unfollow: (shopId: string) => Promise<void>;
  isFollowing: (shopId: string) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider = ({ children }: { children: ReactNode }) => {
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set());

  const follow = async (shopId: string) => {
    setFollowedShops(prev => new Set([...prev, shopId]));
  };

  const unfollow = async (shopId: string) => {
    setFollowedShops(prev => {
      const n = new Set(prev);
      n.delete(shopId);
      return n;
    });
  };

  const isFollowing = (shopId: string) => followedShops.has(shopId);

  return (
    <FollowContext.Provider value={{ followedShops, follow, unfollow, isFollowing }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};
