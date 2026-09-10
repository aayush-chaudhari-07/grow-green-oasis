import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api';
import type { Plant } from '@/data/plants';

interface WishlistContextType {
  wishlistItems: Plant[];
  wishlistIds: Set<string>;
  wishlistCount: number;
  isLoading: boolean;
  toggleWishlist: (plant: Plant) => Promise<boolean>;
  isInWishlist: (plantId: string) => boolean;
  removeFromWishlist: (plantId: string) => Promise<void>;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, setIsAuthModalOpen } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Plant[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      // Guest local storage fallback
      try {
        const local = localStorage.getItem('grow_green_wishlist');
        if (local) {
          const parsed: Plant[] = JSON.parse(local);
          setWishlistItems(parsed);
          setWishlistIds(new Set(parsed.map((p) => p.id)));
        }
      } catch (e) {
        console.error('Failed to read local wishlist', e);
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch<{ items: Plant[] }>('/api/wishlist');
      if (res.ok && res.data?.items) {
        setWishlistItems(res.data.items);
        setWishlistIds(new Set(res.data.items.map((p) => p.id)));
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist, user]);

  const toggleWishlist = async (plant: Plant): Promise<boolean> => {
    const exists = wishlistIds.has(plant.id);

    if (!isAuthenticated) {
      // Toggle locally for guest
      let updated: Plant[];
      if (exists) {
        updated = wishlistItems.filter((p) => p.id !== plant.id);
        toast.info(`Removed ${plant.name} from wishlist`);
      } else {
        updated = [...wishlistItems, plant];
        toast.success(`Saved ${plant.name} to wishlist!`);
      }
      setWishlistItems(updated);
      setWishlistIds(new Set(updated.map((p) => p.id)));
      localStorage.setItem('grow_green_wishlist', JSON.stringify(updated));
      return !exists;
    }

    // Save previous state for optimistic rollback
    const prevItems = [...wishlistItems];
    const prevIds = new Set(wishlistIds);

    // Optimistic UI update
    let nextItems: Plant[];
    const nextIds = new Set(wishlistIds);

    if (exists) {
      nextItems = wishlistItems.filter((p) => p.id !== plant.id);
      nextIds.delete(plant.id);
      toast.info(`Removed ${plant.name} from wishlist`);
    } else {
      nextItems = [...wishlistItems, plant];
      nextIds.add(plant.id);
      toast.success(`Saved ${plant.name} to wishlist!`);
    }

    setWishlistItems(nextItems);
    setWishlistIds(nextIds);

    // Background API Sync
    try {
      const res = await apiFetch<{ message: string; inWishlist: boolean }>('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ plantId: plant.id })
      });

      if (!res.ok || !res.data) {
        toast.error(res.error || 'Failed to update wishlist');
        setWishlistItems(prevItems);
        setWishlistIds(prevIds);
        return exists;
      }
      return res.data.inWishlist;
    } catch (err) {
      toast.error('Network error updating wishlist');
      setWishlistItems(prevItems);
      setWishlistIds(prevIds);
      return exists;
    }
  };

  const removeFromWishlist = async (plantId: string) => {
    const item = wishlistItems.find((p) => p.id === plantId);
    if (!item) return;

    if (!isAuthenticated) {
      const updated = wishlistItems.filter((p) => p.id !== plantId);
      setWishlistItems(updated);
      setWishlistIds(new Set(updated.map((p) => p.id)));
      localStorage.setItem('grow_green_wishlist', JSON.stringify(updated));
      toast.info('Item removed from wishlist');
      return;
    }

    const prevItems = [...wishlistItems];
    const prevIds = new Set(wishlistIds);

    // Optimistic UI update
    const nextItems = wishlistItems.filter((p) => p.id !== plantId);
    const nextIds = new Set(wishlistIds);
    nextIds.delete(plantId);

    setWishlistItems(nextItems);
    setWishlistIds(nextIds);
    toast.info('Item removed from wishlist');

    try {
      const res = await apiFetch(`/api/wishlist/remove/${plantId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        toast.error(res.error || 'Failed to remove item');
        setWishlistItems(prevItems);
        setWishlistIds(prevIds);
      }
    } catch (err) {
      toast.error('Failed to remove item');
      setWishlistItems(prevItems);
      setWishlistIds(prevIds);
    }
  };

  const isInWishlist = (plantId: string) => wishlistIds.has(plantId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistIds,
        wishlistCount: wishlistItems.length,
        isLoading,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        fetchWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
