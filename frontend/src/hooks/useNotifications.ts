import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/api';
import { formatRelative } from '../lib/utils';
import { useSocketContext } from '../context/SocketContext';
import { useToastContext } from '../context/ToastContext';

export interface AppNotification {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { socket } = useSocketContext();
  const { showToast } = useToastContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ notifications: AppNotification[] }>('/api/notifications');
      setNotifications(data.notifications);
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

  useEffect(() => {
    if (!socket) return;

    function addRealtimeNotification(type: string, content: string) {
      const notification: AppNotification = {
        id: `realtime-${type}-${Date.now()}`,
        type,
        content,
        metadata: {},
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [notification, ...prev]);
    }

    const handleFriendRequest = (payload: { from_display_name?: string }) => {
      const name = payload.from_display_name ?? 'Someone';
      const content = `${name} wants to be friends.`;
      addRealtimeNotification('friend_request', content);
      showToast(content, 'info');
      void refetch();
    };

    const handleFriendResponse = (payload: { responder_display_name?: string; status?: string }) => {
      const name = payload.responder_display_name ?? 'Someone';
      const content =
        payload.status === 'accepted'
          ? `You and ${name} are friends.`
          : `${name} passed on your friend request.`;
      addRealtimeNotification('friend_request_response', content);
      showToast(content, payload.status === 'accepted' ? 'success' : 'info');
      void refetch();
    };

    const handleGift = (payload: { from_display_name?: string; item_name?: string; message?: string | null }) => {
      const name = payload.from_display_name ?? 'A friend';
      const item = payload.item_name ?? 'a gift';
      const base = `Gift from ${name}: ${item}.`;
      const content = payload.message ? `${base} "${payload.message}"` : base;
      addRealtimeNotification('gift_received', content);
      showToast(content, 'success');
      void refetch();
    };

    // Item drops are surfaced by <ItemDropToast> on the dashboard (with image
    // + rarity). Adding a second showToast here was the source of the stacked
    // "Item found" + "You found X." pair. We still record the notification so
    // it shows up in the bell history.
    const handleItemDrop = (payload: { item_name?: string }) => {
      const content = `New drop: ${payload.item_name ?? 'an item'}.`;
      addRealtimeNotification('item_drop', content);
      void refetch();
    };

    socket.on('friend_request', handleFriendRequest);
    socket.on('friend_request_responded', handleFriendResponse);
    socket.on('gift_received', handleGift);
    socket.on('item_dropped', handleItemDrop);
    return () => {
      socket.off('friend_request', handleFriendRequest);
      socket.off('friend_request_responded', handleFriendResponse);
      socket.off('gift_received', handleGift);
      socket.off('item_dropped', handleItemDrop);
    };
  }, [socket, showToast, refetch]);

  const markAllRead = useCallback(async () => {
    await api.put('/api/notifications/read');
    setNotifications([]);
  }, []);

  return useMemo(
    () => ({
      notifications,
      unreadCount: notifications.length,
      isLoading,
      error,
      refetch,
      markAllRead,
      formatRelative,
    }),
    [notifications, isLoading, error, refetch, markAllRead],
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not load notifications.';
  }
  return 'Could not load notifications.';
}
