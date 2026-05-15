import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';
import type { PetSpecies } from '../components/common/PlaceholderPet';

export interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  streak_current: number | null;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_display_name: string;
  from_avatar_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface SentFriendRequest {
  id: string;
  to_user_id: string;
  to_username: string;
  to_display_name: string;
  to_avatar_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ReceivedGift {
  id: string;
  from_user_id: string;
  from_username: string;
  from_display_name: string;
  from_avatar_url: string | null;
  item_id: string;
  item_name: string;
  item_image_url: string | null;
  message: string | null;
  is_accepted: boolean;
  sent_at: string;
}

export interface UserSearchResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
}

export interface FriendProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
  level: number;
  streak_current: number | null;
  total_habits_completed: number | null;
  pet: {
    species: PetSpecies;
    name: string;
    health: number;
    is_fainted: boolean;
  } | null;
}

export function useSocial() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: friendsRes },
        { data: requestsRes },
        { data: sentRequestsRes },
        { data: giftsRes },
      ] = await Promise.all([
        api.get<{ friends: Friend[] }>('/api/social/friends'),
        api.get<{ requests: FriendRequest[] }>('/api/social/friends/requests'),
        api.get<{ requests: SentFriendRequest[] }>('/api/social/friends/requests/sent'),
        api.get<{ gifts: ReceivedGift[] }>('/api/social/gifts/received'),
      ]);
      setFriends(friendsRes.friends);
      setRequests(requestsRes.requests);
      setSentRequests(sentRequestsRes.requests);
      setReceivedGifts(giftsRes.gifts);
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

  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    if (query.trim().length < 2) return [];
    const { data } = await api.get<{ users: UserSearchResult[] }>('/api/user/search', {
      params: { q: query.trim() },
    });
    return data.users;
  }, []);

  const sendRequest = useCallback(
    async (username: string): Promise<void> => {
      await api.post('/api/social/friends/request', { username });
      await refetch();
    },
    [refetch],
  );

  const respondRequest = useCallback(
    async (requestId: string, action: 'accept' | 'reject'): Promise<void> => {
      await api.put(`/api/social/friends/request/${requestId}`, { action });
      await refetch();
    },
    [refetch],
  );

  const sendGift = useCallback(
    async (friendId: string, itemId: string, message?: string): Promise<void> => {
      await api.post('/api/social/gifts/send', {
        friend_id: friendId,
        item_id: itemId,
        message: message?.trim() || undefined,
      });
    },
    [],
  );

  const acceptGift = useCallback(
    async (giftId: string): Promise<void> => {
      await api.post(`/api/social/gifts/${giftId}/accept`);
      await refetch();
    },
    [refetch],
  );

  const getFriendProfile = useCallback(async (friendId: string): Promise<FriendProfile> => {
    const { data } = await api.get<FriendProfile>(`/api/user/friends/${friendId}/profile`);
    return data;
  }, []);

  return {
    friends,
    requests,
    sentRequests,
    receivedGifts,
    isLoading,
    error,
    refetch,
    searchUsers,
    sendRequest,
    respondRequest,
    sendGift,
    acceptGift,
    getFriendProfile,
  };
}

export function extractMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { error?: { message?: string; issues?: Array<{ message?: string }> } }
      | undefined;
    return data?.error?.issues?.find((issue) => issue.message)?.message ?? data?.error?.message ?? fallback;
  }
  return fallback;
}
