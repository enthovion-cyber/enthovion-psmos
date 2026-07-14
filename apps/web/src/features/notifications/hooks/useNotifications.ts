'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useMe } from '@/features/iam/hooks/useIam';
import { notificationsService } from '@/services/notifications.service';
import { useMutationToast } from '@/providers/ToastProvider';

export function useNotifications(params?: Record<string, string>) {
  return useQuery({ queryKey: ['notifications', params], queryFn: () => notificationsService.list(params), refetchInterval: 30000 });
}

export function useUnreadNotifications() {
  return useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => notificationsService.unreadCount(), refetchInterval: 15000 });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    ]);
  };
  return {
    markRead: useMutation({ mutationFn: (id: string) => notificationsService.markRead(id), onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: () => notificationsService.markAllRead(), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (id: string) => notificationsService.archive(id), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: (id: string) => notificationsService.delete(id), onSuccess: invalidate }),
    testEmail: useMutation({ mutationFn: () => notificationsService.testEmail(), onSuccess: invalidate }),
    testSms: useMutation({ mutationFn: () => notificationsService.testSms(), onSuccess: invalidate })
  };
}

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const me = useMe().data;
  const toast = useMutationToast();

  useEffect(() => {
    if (!me?.id) return;
    let client: ReturnType<typeof createBrowserSupabaseClient> | null = null;
    try {
      client = createBrowserSupabaseClient();
    } catch {
      return;
    }
    const channel = client
      .channel(`notifications:${me.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` }, (payload) => {
        const next = payload.new as { title?: string; message?: string; priority?: string };
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        if (next.priority === 'High' || next.priority === 'Safety-Critical') {
          toast.warning(next.title ?? 'New notification', next.message);
        }
      })
      .subscribe();
    return () => {
      void client?.removeChannel(channel);
    };
  }, [me?.id, queryClient, toast]);
}
