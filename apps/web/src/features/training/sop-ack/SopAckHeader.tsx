'use client';

import { TrainingButton } from '../shared/TrainingUi';

export function SopAckHeader({ title = 'SOP Acknowledgements', subtitle = 'Current approved procedure acknowledgement evidence, blockers, waivers, verification, and version gaps.', actions = true }: { title?: string; subtitle?: string; actions?: boolean }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-1 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2">
          <TrainingButton href="/training-competency/sop-acknowledgements/requirements/new">New Requirement</TrainingButton>
          <TrainingButton href="/training-competency/sop-acknowledgements/assignments" variant="secondary">Assignments</TrainingButton>
          <TrainingButton href="/training-competency/sop-acknowledgements/import" variant="secondary">Import</TrainingButton>
        </div>
      ) : null}
    </header>
  );
}
