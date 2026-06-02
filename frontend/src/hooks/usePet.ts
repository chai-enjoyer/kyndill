import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';
import type { PetSpecies } from '../components/common/PlaceholderPet';

export interface EquippedItem {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  image_url: string | null;
}

export type EquipSlot = 'hat' | 'accessory' | 'glasses' | 'scarf' | 'badge' | 'charm';

export interface PetFullState {
  id: string;
  user_id: string;
  species: PetSpecies;
  name: string;
  health: number;
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  stage: number;
  total_habits_completed: number;
  is_fainted: boolean;
  initialized_at: string | null;
  created_at: string;
  equipped: Partial<Record<EquipSlot, EquippedItem>>;
}

export function usePet() {
  const [pet, setPet] = useState<PetFullState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<PetFullState>('/api/pet');
      setPet(data);
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

  const feed = useCallback(async (itemId: string): Promise<void> => {
    const { data } = await api.post<Partial<PetFullState>>('/api/pet/feed', { item_id: itemId });
    setPet((prev) => (prev ? { ...prev, ...data } : prev));
  }, []);

  // Instant revive by spending a streak freeze. Returns the new freeze count
  // so callers can keep the shop/sidebar in sync without a refetch.
  const revive = useCallback(async (): Promise<number> => {
    const { data } = await api.post<{ pet: PetFullState; new_freeze_count: number }>(
      '/api/pet/revive',
    );
    setPet((prev) => (prev ? { ...prev, ...data.pet } : data.pet));
    return data.new_freeze_count;
  }, []);

  const equip = useCallback(async (itemId: string): Promise<void> => {
    const { data } = await api.post<{ equipped: PetFullState['equipped'] }>('/api/pet/equip', {
      item_id: itemId,
    });
    setPet((prev) => (prev ? { ...prev, equipped: data.equipped } : prev));
  }, []);

  const unequip = useCallback(async (slot: EquipSlot): Promise<void> => {
    await api.post('/api/pet/unequip', { slot });
    setPet((prev) => {
      if (!prev) return prev;
      const equipped = { ...prev.equipped };
      delete equipped[slot];
      return { ...prev, equipped };
    });
  }, []);

  const rename = useCallback(async (name: string): Promise<void> => {
    const { data } = await api.patch<PetFullState>('/api/pet/name', { name });
    setPet((prev) => (prev ? { ...prev, name: data.name } : data));
  }, []);

  // Update locally after a habit-completion response, mirroring the backend
  // stage rules so we don't need an extra round-trip.
  const applyCompletion = useCallback(
    (partial: {
      health: number;
      happiness: number;
      hunger: number;
      energy: number;
      cleanliness: number;
      total_habits_completed: number;
      is_fainted: boolean;
    }) => {
      setPet((prev) => {
        if (!prev) return prev;
        const stage =
          partial.total_habits_completed >= 201
            ? 3
            : partial.total_habits_completed >= 51
              ? 2
              : 1;
        return { ...prev, ...partial, stage };
      });
    },
    [],
  );

  return { pet, isLoading, error, refetch, feed, revive, equip, unequip, rename, applyCompletion };
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load your companion.';
  }
  return 'Could not load your companion.';
}
