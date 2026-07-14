'use client';

import { X, Bell, BellOff, Check, Layers } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useNotificationStore } from '@/stores/notification.store';
import type { NotificationRecord } from '@/services/notifications.service';
import { useNotificationMutations, useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export function NotificationDrawer() {
  const open = useNotificationStore((state) => state.drawerOpen);
  const setOpen = useNotificationStore((state) => state.setDrawerOpen);
  
  // Fetch unread notifications
  const notificationsQuery = useNotifications({ status: 'Unread' });
  const mutations = useNotificationMutations();
  const toast = useMutationToast();

  // FIX: Extract the raw inner array safely from the backend envelope wrapper ({ data: [], meta: {} })
  const envelope = notificationsQuery.data as unknown;
  const notifications: NotificationRecord[] = Array.isArray(envelope)
    ? envelope
    : isNotificationEnvelope(envelope)
    ? envelope.data
    : [];

  const grouped = groupNotifications(notifications);

  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
    } catch (error) {
      toast.error(
        'Notification request failed', 
        error instanceof Error ? error.message : 'Request failed'
      );
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Drawer Overlay backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
        onClick={() => setOpen(false)} 
      />
      
      {/* Sidebar Container */}
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl transition-transform duration-300">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4 bg-slate-950/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Bell size={18} className={notifications.length ? 'animate-bounce' : ''} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Notification Center</h2>
              <p className="text-xs font-medium text-[var(--psm-muted)]">
                {notifications.length} unread alert{notifications.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setOpen(false)} 
            className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Panel */}
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] bg-slate-950/5 px-4 py-2.5">
          <a 
            href="/notifications" 
            onClick={() => setOpen(false)} 
            className="text-xs font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
          >
            <Layers size={12} /> Open Full Center
          </a>
          {notifications.length > 0 && (
            <button 
              type="button" 
              className="text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 flex items-center gap-1" 
              onClick={() => run(() => mutations.markAllRead.mutateAsync(), 'All notifications marked read')}
            >
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>

        {/* Content Stream Layer */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {notificationsQuery.isLoading && (
            <div className="psm-card p-4 text-sm text-center text-[var(--psm-muted)] animate-pulse">
              Loading notifications...
            </div>
          )}
          
          {notificationsQuery.isError && (
            <div className="psm-card border-danger/40 p-4 text-sm text-danger bg-danger/5 rounded-lg">
              Unable to load real-time notification records.
            </div>
          )}
          
          {!notificationsQuery.isLoading && !notifications.length && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--psm-line)] p-12 text-center bg-slate-950/5">
              <BellOff size={28} className="text-[var(--psm-muted)] mb-2 opacity-60" />
              <p className="text-sm font-medium text-[var(--psm-muted)]">No unread notifications.</p>
              <p className="text-xs text-[var(--psm-muted)]/70 mt-1">We will alert you when operation parameters change.</p>
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(grouped).map(([label, rows]) => rows.length ? (
              <section key={label} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--psm-muted)]">
                    {label}
                  </h3>
                  <div className="h-[1px] flex-1 bg-[var(--psm-line)] opacity-50" />
                </div>
                <div className="space-y-2.5">
                  {rows.map((item) => (
                    <NotificationItem 
                      key={item.id} 
                      notification={item} 
                      onRead={() => run(() => mutations.markRead.mutateAsync(item.id), 'Notification marked read')} 
                      onArchive={() => run(() => mutations.archive.mutateAsync(item.id), 'Notification archived')} 
                      onDelete={() => run(() => mutations.delete.mutateAsync(item.id), 'Notification deleted')} 
                    />
                  ))}
                </div>
              </section>
            ) : null)}
          </div>
        </div>
      </aside>
    </>
  );
}

function isNotificationEnvelope(value: unknown): value is { data: NotificationRecord[] } {
  return Boolean(value && typeof value === 'object' && 'data' in value && Array.isArray((value as { data?: unknown }).data));
}

function groupNotifications(rows: NotificationRecord[]) {
  // SAFEGUARD: Gracefully handle nested data configurations or non-array returns
  if (!Array.isArray(rows)) {
    console.warn("groupNotifications expected an array but got:", rows);
    return { Today: [], Yesterday: [], Older: [] };
  }

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  return rows.reduce<Record<string, NotificationRecord[]>>((acc, row) => {
    if (!row || !row.created_at) return acc;
    
    const day = new Date(row.created_at).toDateString();
    const key = day === today ? 'Today' : day === yesterday ? 'Yesterday' : 'Older';
    
    acc[key] ??= [];
    acc[key].push(row);
    return acc;
  }, { Today: [], Yesterday: [], Older: [] });
}
