'use client';

import { TrainingButton } from '../shared/TrainingUi';

export function TrainingRecordsHeader({ title = 'Training Records + Attendance', subtitle, primaryHref = '/training-competency/training-records/sessions/new' }: { title?: string; subtitle?: string; primaryHref?: string }) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Training & Competency</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{subtitle ?? 'Capture real sessions, rosters, attendance, evidence, verification, approval, and Training Matrix closure evidence.'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <TrainingButton href={primaryHref}>Create session</TrainingButton>
        <TrainingButton href="/training-competency/training-records/records/new" variant="secondary">Manual record</TrainingButton>
        <TrainingButton href="/training-competency/training-records/import" variant="secondary">Import</TrainingButton>
      </div>
    </header>
  );
}
