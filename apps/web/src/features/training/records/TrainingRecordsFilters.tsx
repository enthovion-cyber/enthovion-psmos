'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TrainingButton, TrainingCard } from '../shared/TrainingUi';

export function TrainingRecordsFilters({ lookups }: { lookups?: Record<string, string[]> | undefined }) {
  const router = useRouter();
  const params = useSearchParams();
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`?${next.toString()}`);
  };
  return (
    <TrainingCard title="Advanced filters / search" subtitle="Server-backed filters for site, unit, worker, training item, status, instructor, date range, and linked blockers.">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search title, code, worker" defaultValue={params.get('search') ?? ''} onBlur={(e) => update('search', e.currentTarget.value)} />
        <Select label="Session status" value={params.get('sessionStatus') ?? ''} options={lookups?.['session-statuses'] ?? []} onChange={(v) => update('sessionStatus', v)} />
        <Select label="Attendance status" value={params.get('attendanceStatus') ?? ''} options={lookups?.['attendance-statuses'] ?? []} onChange={(v) => update('attendanceStatus', v)} />
        <Select label="Completion status" value={params.get('completionStatus') ?? ''} options={lookups?.['completion-statuses'] ?? []} onChange={(v) => update('completionStatus', v)} />
      </div>
      <div className="mt-3 flex justify-end"><TrainingButton variant="secondary" onClick={() => router.push('?')}>Clear filters</TrainingButton></div>
    </TrainingCard>
  );
}

function Select({ label, value, options = [], onChange }: { label: string; value: string; options?: string[] | undefined; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">
      {label}
      <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-fg)]" value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
