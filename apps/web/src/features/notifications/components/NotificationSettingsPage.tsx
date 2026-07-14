'use client';

import { useMemo, useState } from 'react';
import { Archive, CheckCheck, Filter } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useNotificationMutations, useNotifications } from '../hooks/useNotifications';
import { NotificationItem, PriorityBadge } from './NotificationItem';
import { NotificationPreferences } from './NotificationPreferences';

export function NotificationSettingsPage() {
  const [status, setStatus] = useState('');
  const [module, setModule] = useState('');
  const params = useMemo(() => ({ ...(status ? { status } : {}), ...(module ? { module } : {}) }), [status, module]);
  const notificationsQuery = useNotifications(params);
  const mutations = useNotificationMutations();
  const toast = useMutationToast();
  const notifications = notificationsQuery.data ?? [];
  const unread = (Array.isArray(notifications) ? notifications : [])
  .filter((item) => item.status === 'Unread').length;
 const critical = (Array.isArray(notifications) ? notifications : [])
  .filter((item) => item.priority === 'Safety-Critical').length; 
  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
    } catch (error) {
      toast.error('Notification action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Notification Center</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">In-app, email, SMS, digest, escalation, and safety-critical alert management for all PSM OS modules.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Visible" value={String(notifications.length)} />
            <Metric label="Unread" value={String(unread)} />
            <Metric label="Safety Critical" value={String(critical)} danger />
          </div>
        </div>
      </section>

      <section className="psm-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter size={16} /> Filters</div>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="psm-input h-10 px-3 text-sm">
              <option value="">All statuses</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
              <option value="Archived">Archived</option>
            </select>
            <input value={module} onChange={(event) => setModule(event.target.value)} placeholder="Module" className="psm-input h-10 px-3 text-sm" />
            <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.markAllRead.mutateAsync(), 'All notifications marked read')}><CheckCheck size={15} /> Mark All Read</button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-3">
          {(Array.isArray(notifications) ? notifications : []).map((item) => <NotificationItem key={item.id} notification={item} onRead={() => run(() => mutations.markRead.mutateAsync(item.id), 'Notification marked read')} onArchive={() => run(() => mutations.archive.mutateAsync(item.id), 'Notification archived')} onDelete={() => run(() => mutations.delete.mutateAsync(item.id), 'Notification deleted')} />)}
          {notificationsQuery.isLoading ? <div className="psm-card p-5">Loading notifications...</div> : null}
          {!notificationsQuery.isLoading && !(Array.isArray(notifications) ? notifications : []).length ? <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-10 text-center text-sm text-[var(--psm-muted)]">No notifications match the current filters.</div> : null}
        </section>
        <aside className="space-y-5">
          <DigestCard title="Daily Digest Preview" items={['Open actions', 'Overdue actions', 'Pending verifications', 'Document reviews due', 'Upcoming inspections']} />
          <DigestCard title="Weekly Summary Preview" items={['Actions opened/closed', 'Overdue trend', 'Safety-critical items', 'Document review status', 'Equipment inspection due']} />
          <section className="psm-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Priority Legend</h2>
            <div className="flex flex-wrap gap-2"><PriorityBadge priority="Info" /><PriorityBadge priority="Normal" /><PriorityBadge priority="High" /><PriorityBadge priority="Safety-Critical" /></div>
          </section>
        </aside>
      </div>

      <NotificationPreferences />
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</div><div className={`mt-2 text-2xl font-semibold ${danger ? 'text-danger' : ''}`}>{value}</div></div>;
}

function DigestCard({ title, items }: { title: string; items: string[] }) {
  return <section className="psm-card p-5"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h2><div className="space-y-2">{items.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-[var(--psm-muted)]"><Archive size={14} /> {item}</div>)}</div></section>;
}
