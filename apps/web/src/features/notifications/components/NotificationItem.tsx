'use client';

import { Archive, Check, ExternalLink, Trash2 } from 'lucide-react';
import type { NotificationRecord } from '@/services/notifications.service';

export function NotificationItem({ notification, onRead, onArchive, onDelete }: { notification: NotificationRecord; onRead: () => void; onArchive: () => void; onDelete: () => void }) {
  const unread = notification.status === 'Unread';
  return (
    <div className={`rounded-xl border p-3 ${unread ? 'border-primary/30 bg-primary/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">{notification.title}</strong>
            <PriorityBadge priority={notification.priority} />
            <span className="psm-badge psm-badge-muted">{notification.module}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{notification.message}</p>
          <div className="mt-2 text-xs text-[var(--psm-muted)]">{new Date(notification.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {notification.related_url ? <a href={notification.related_url} className="psm-button psm-button-secondary h-8 text-xs"><ExternalLink size={13} /> Open Record</a> : null}
        {unread ? <button type="button" onClick={onRead} className="psm-button psm-button-secondary h-8 text-xs"><Check size={13} /> Read</button> : null}
        <button type="button" onClick={onArchive} className="psm-button psm-button-secondary h-8 text-xs"><Archive size={13} /> Archive</button>
        <button type="button" onClick={onDelete} className="psm-button psm-button-danger h-8 text-xs"><Trash2 size={13} /> Delete</button>
      </div>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const style = priority === 'Safety-Critical' ? 'psm-badge-danger' : priority === 'High' ? 'psm-badge-warning' : priority === 'Info' ? 'psm-badge-info' : 'psm-badge-muted';
  return <span className={`psm-badge ${style}`}>{priority}</span>;
}
