import type { ReactNode } from 'react';
import { TrainingButton } from '../shared/TrainingUi';

export function RequiredTrainingHeader({ title = 'Required Training Library', subtitle = 'Controlled training catalog, recurrence, evidence, document links, and matrix/competency sync.', actions }: { title?: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Training & Competency</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions ?? <>
          <TrainingButton href="/training-competency/required-training/library/new">New Required Training</TrainingButton>
          <TrainingButton href="/training-competency/required-training/library" variant="secondary">Open Library</TrainingButton>
          <TrainingButton href="/training-competency/required-training/settings" variant="secondary">Settings</TrainingButton>
        </>}
      </div>
    </div>
  );
}
