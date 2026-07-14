'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useSettingsNavigation } from './hooks/useSettingsNavigation';
import { SettingsCardGrid } from './SettingsCardGrid';
import { SettingsPermissionDeniedState } from './SettingsPermissionDeniedState';

export function SettingsHomePage() {
  const navigation = useSettingsNavigation();
  const [search, setSearch] = useState('');
  if (navigation.isLoading) return <div className="psm-card p-5 text-sm text-[var(--psm-muted)]">Loading settings...</div>;
  if (navigation.isError) return <SettingsPermissionDeniedState />;
  const sections = navigation.data?.sections ?? [];
  return (
    <main className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Permission-aware workspace, account, billing, and support settings.</p>
          </div>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3">
            <Search size={16} className="text-[var(--psm-muted)]" />
            <input className="w-72 bg-transparent text-sm outline-none" placeholder="Search settings..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>
      </section>
      {sections.length ? <SettingsCardGrid sections={sections} search={search} /> : <SettingsPermissionDeniedState />}
    </main>
  );
}
