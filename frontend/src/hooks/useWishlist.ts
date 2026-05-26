import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

export interface WishlistEntry {
  position: number;
  item_id: string;
  name: string;
  type: 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  image_url: string | null;
  effect_stat: string | null;
  effect_amount: number | null;
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ wishlist: WishlistEntry[] }>('/api/wishlist');
      setWishlist(data.wishlist);
      setError(null);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(async (itemIds: string[]) => {
    const { data } = await api.put<{ wishlist: WishlistEntry[] }>('/api/wishlist', {
      item_ids: itemIds,
    });
    setWishlist(data.wishlist);
    return data.wishlist;
  }, []);

  return { wishlist, isLoading, error, refetch, save };
}

export async function fetchFriendWishlist(friendId: string): Promise<WishlistEntry[]> {
  const { data } = await api.get<{ wishlist: WishlistEntry[] }>(
    `/api/wishlist/friend/${friendId}`,
  );
  return data.wishlist;
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load wishlist.';
  }
  return 'Could not load wishlist.';
}
