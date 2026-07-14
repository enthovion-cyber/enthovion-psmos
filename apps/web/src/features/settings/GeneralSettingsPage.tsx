'use client';

import { useEffect, useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useGeneralSettings, useSaveGeneralSettings } from './hooks/useSettingsNavigation';

export function GeneralSettingsPage() {
  const query = useGeneralSettings();
  const save = useSaveGeneralSettings();
  const toast = useMutationToast();
  const preferences = query.data?.preferences ?? query.data ?? {};
  const [form, setForm] = useState({ timezone: preferences.timezone ?? '', language: preferences.language ?? '', themePreference: preferences.theme_preference ?? '', sidebarCollapsed: Boolean(preferences.sidebar_collapsed) });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      timezone: preferences.timezone ?? '',
      language: preferences.language ?? '',
      themePreference: preferences.theme_preference ?? 'system',
      sidebarCollapsed: Boolean(preferences.sidebar_collapsed)
    });
  }, [query.data]);

  async function submit() {
    try {
      await save.mutateAsync(form);
      toast.success('General settings saved');
    } catch (error) {
      toast.error('Settings save failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <main className="space-y-5">
      <section className="psm-card p-5">
        <h1 className="text-2xl font-semibold">General Settings</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Personal preferences for timezone, language, theme, and sidebar behavior.</p>
      </section>
      <section className="psm-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Timezone" value={form.timezone} onChange={(timezone) => setForm({ ...form, timezone })} />
          <Field label="Language" value={form.language} onChange={(language) => setForm({ ...form, language })} />
          <Field label="Theme preference" value={form.themePreference} onChange={(themePreference) => setForm({ ...form, themePreference })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.sidebarCollapsed} onChange={(event) => setForm({ ...form, sidebarCollapsed: event.target.checked })} />
            Collapse sidebar by default
          </label>
        </div>
        <button className="psm-button psm-button-primary mt-5" disabled={save.isPending} onClick={() => void submit()}>Save Changes</button>
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}</span>
      <input className="psm-input w-full px-3" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
