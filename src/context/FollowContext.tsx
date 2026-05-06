import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FollowContextType {
  followedShops: Set<string>;
  follow: (shopId: string) => Promise<void>;
  unfollow: (shopId: string) => Promise<void>;
  isFollowing: (shopId: string) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set());

  const fetchFollows = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows')
      .select('shop_id').eq('follower_id', user.id);
    setFollowedShops(new Set(data?.map(f => f.shop_id) || []));
  };

  useEffect(() => {
    if (user) {
      fetchFollows();
    } else {
      setFollowedShops(new Set());
    }
  }, [user]);

  const follow = async (shopId: string) => {
    if (!user) return;
    setFollowedShops(prev => new Set([...prev, shopId])); // optimistic
    const { error } = await supabase.from('follows')
      .insert({ follower_id: user.id, shop_id: shopId });
    
    if (error) {
      // rollback
      setFollowedShops(prev => {
        const n = new Set(prev);
        n.delete(shopId);
        return n;
      });
    }
  };

  const unfollow = async (shopId: string) => {
    if (!user) return;
    setFollowedShops(prev => {
      const n = new Set(prev);
      n.delete(shopId);
      return n;
    }); // optimistic
    
    const { error } = await supabase.from('follows').delete()
      .eq('follower_id', user.id).eq('shop_id', shopId);
    
    if (error) {
      // rollback
      setFollowedShops(prev => new Set([...prev, shopId]));
    }
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
