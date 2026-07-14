'use client';

import { Save, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { NotificationPreferenceInput } from '@/services/notifications.service';
import { useNotificationMutations } from '../hooks/useNotifications';
import { useNotificationPreferenceMutations, useNotificationPreferences } from '../hooks/useNotificationPreferences';

export function NotificationPreferences() {
  const preferencesQuery = useNotificationPreferences();
  const preferenceMutations = useNotificationPreferenceMutations();
  const notificationMutations = useNotificationMutations();
  const toast = useMutationToast();
  const [draft, setDraft] = useState<Record<string, NotificationPreferenceInput>>({});
  const rows = useMemo(() => {
   // ... inside your useMemo or function block
const source = Array.isArray(preferencesQuery.data) ? preferencesQuery.data : [];

return source.map((pref) => draft[`${pref.module}:${pref.event_type}`] ?? {
  module: pref.module,
  eventType: pref.event_type,
  inAppEnabled: pref.in_app_enabled,
  emailEnabled: pref.email_enabled,
  smsEnabled: pref.sms_enabled,
  digestEnabled: pref.digest_enabled
});
}, [preferencesQuery.data, draft]);

  function update(row: NotificationPreferenceInput, patch: Partial<NotificationPreferenceInput>) {
    setDraft((current) => ({ ...current, [`${row.module}:${row.eventType}`]: { ...row, ...patch } }));
  }

  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
    } catch (error) {
      toast.error('Notification settings failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <section className="psm-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--psm-line)] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Notification Preferences</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Configure delivery by module and event type.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="psm-button psm-button-secondary" onClick={() => run(() => notificationMutations.testEmail.mutateAsync(), 'Test email queued')}><Send size={15} /> Test Email</button>
          <button type="button" className="psm-button psm-button-secondary" onClick={() => run(() => notificationMutations.testSms.mutateAsync(), 'Test SMS queued')}><Send size={15} /> Test SMS</button>
          <button type="button" className="psm-button psm-button-primary" onClick={() => run(() => preferenceMutations.update.mutateAsync(rows), 'Preferences saved')}><Save size={15} /> Save Preferences</button>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="psm-table w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">In-App</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">SMS</th>
              <th className="px-4 py-3">Digest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.module}:${row.eventType}`} className="border-t border-[var(--psm-line)]">
                <td className="px-4 py-3 font-semibold">{row.module}</td>
                <td className="px-4 py-3 text-[var(--psm-muted)]">{row.eventType}</td>
                <Toggle checked={row.inAppEnabled} onChange={(checked) => update(row, { inAppEnabled: checked })} />
                <Toggle checked={row.emailEnabled} onChange={(checked) => update(row, { emailEnabled: checked })} />
                <Toggle checked={row.smsEnabled} onChange={(checked) => update(row, { smsEnabled: checked })} />
                <Toggle checked={row.digestEnabled} onChange={(checked) => update(row, { digestEnabled: checked })} />
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--psm-muted)]">{preferencesQuery.isLoading ? 'Loading preferences...' : 'No preferences found.'}</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <td className="px-4 py-3"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></td>;
}
