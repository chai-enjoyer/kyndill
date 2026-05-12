import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

export interface InventoryEntry {
  id: string;
  name: string;
  type: 'cosmetic' | 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  price: number;
  effect_stat: string | null;
  effect_amount: number | null;
  image_url: string | null;
  category: string | null;
  quantity: number;
  equipped_slot: string | null;
}

interface InventoryListing {
  consumables: InventoryEntry[];
  cosmetics: InventoryEntry[];
  streak_freezes: InventoryEntry[];
}

const EMPTY: InventoryListing = { consumables: [], cosmetics: [], streak_freezes: [] };

export function useInventory() {
  const [data, setData] = useState<InventoryListing>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<InventoryListing>('/api/inventory');
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

  return {
    consumables: data.consumables,
    cosmetics: data.cosmetics,
    streak_freezes: data.streak_freezes,
    isLoading,
    error,
    refetch,
  };
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load inventory.';
  }
  return 'Could not load inventory.';
}
