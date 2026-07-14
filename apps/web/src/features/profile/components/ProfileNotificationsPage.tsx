'use client';

import { useEffect, useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useProfileNotifications, useSaveProfileNotifications } from '../hooks/useAccountSecurity';

export function ProfileNotificationsPage() {
  const query = useProfileNotifications();
  const save = useSaveProfileNotifications();
  const toast = useMutationToast();
  const [form, setForm] = useState({ email: true, inApp: true });

  useEffect(() => {
    if (!query.data) return;
    setForm({ email: query.data.email !== false, inApp: query.data.inApp !== false });
  }, [query.data]);

  async function submit() {
    try {
      await save.mutateAsync(form);
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Notification save failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <main className="space-y-5">
      <section className="psm-card p-5">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Manage email and in-app notification preferences.</p>
      </section>
      <section className="psm-card p-5">
        {query.isLoading ? <p className="text-sm text-[var(--psm-muted)]">Loading preferences...</p> : null}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.email} onChange={(event) => setForm({ ...form, email: event.target.checked })} /> Email notifications</label>
        <label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.inApp} onChange={(event) => setForm({ ...form, inApp: event.target.checked })} /> In-app notifications</label>
        <button className="psm-button psm-button-primary mt-5" disabled={save.isPending} onClick={() => void submit()}>Save Preferences</button>
      </section>
    </main>
  );
}
