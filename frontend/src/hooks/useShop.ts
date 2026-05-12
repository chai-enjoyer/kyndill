import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

export interface ShopItem {
  id: string;
  name: string;
  type: 'cosmetic' | 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  price: number;
  effect_stat: string | null;
  effect_amount: number | null;
  image_url: string | null;
  category: string | null;
}

export interface ShopCosmetic extends ShopItem {
  owned: boolean;
}

interface ShopListing {
  coins: number;
  freeze_count: number;
  items: {
    consumable: ShopItem[];
    cosmetic: ShopCosmetic[];
    streak_freeze: ShopItem[];
  };
}

const EMPTY: ShopListing = {
  coins: 0,
  freeze_count: 0,
  items: { consumable: [], cosmetic: [], streak_freeze: [] },
};

export function useShop() {
  const [data, setData] = useState<ShopListing>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ShopListing>('/api/shop');
      setData(res);
      setError(null);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const purchase = useCallback(
    async (itemId: string): Promise<void> => {
      await api.post('/api/shop/purchase', { item_id: itemId });
      await refetch();
    },
    [refetch],
  );

  const buyStreakFreeze = useCallback(async (): Promise<void> => {
    await api.post('/api/shop/buy-streak-freeze');
    await refetch();
  }, [refetch]);

  return {
    coins: data.coins,
    freezeCount: data.freeze_count,
    cosmetics: data.items.cosmetic,
    consumables: data.items.consumable,
    streakFreezes: data.items.streak_freeze,
    isLoading,
    error,
    refetch,
    purchase,
    buyStreakFreeze,
  };
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load the shop.';
  }
  return 'Could not load the shop.';
}
