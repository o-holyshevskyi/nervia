/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

const LIMIT = 20;

export type NotificationInsertCallback = (notification: NotificationRow) => void;

export function useNotifications(supabase: any, onInsert?: NotificationInsertCallback) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => n.read_at == null).length;

  const fetchNotifications = useCallback(
    async (userId: string) => {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(LIMIT);

      if (fetchError) {
        setError(fetchError.message ?? String(fetchError));
        return;
      }
      const rows = (data ?? []) as NotificationRow[];
      seenIdsRef.current = new Set(rows.map((r) => r.id));
      setNotifications(rows);
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(authUser ?? null);
        if (authUser?.id) {
          await fetchNotifications(authUser.id);
        } else {
          setNotifications([]);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [supabase, fetchNotifications]);

  // Realtime: subscribe to new notifications for this user
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase
      .channel('notifications-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as any;
          if (row.user_id !== user.id) return;
          const newRow: NotificationRow = {
            id: row.id,
            user_id: row.user_id,
            title: row.title ?? '',
            message: row.message ?? '',
            type: row.type ?? '',
            metadata: (row.metadata as Record<string, unknown>) ?? {},
            read_at: row.read_at ?? null,
            created_at: row.created_at ?? new Date().toISOString(),
          };
          if (seenIdsRef.current.has(newRow.id)) return;
          seenIdsRef.current.add(newRow.id);
          onInsert?.(newRow);
          setNotifications((prev) => [newRow, ...prev].slice(0, LIMIT));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, onInsert]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!updateError) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
      }
    },
    [supabase, user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (!updateError) {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    }
  }, [supabase, user?.id]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    error,
  };
}
