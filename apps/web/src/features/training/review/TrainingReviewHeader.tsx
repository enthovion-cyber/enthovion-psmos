'use client';

import { TrainingButton } from '../shared/TrainingUi';
import type { ReactNode } from 'react';

export function TrainingReviewHeader({ title = 'Training Review & Approval', subtitle = 'Training-specific approval packages, validation, e-signatures, stale detection, waivers, and source-module governance.', onRefresh, actions }: { title?: string | undefined; subtitle?: string | undefined; onRefresh?: (() => void) | undefined; actions?: ReactNode | undefined }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Training & Competency</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-2 max-w-5xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions}
        <TrainingButton href="/training-competency/review-approval/packages" variant="secondary">Packages</TrainingButton>
        <TrainingButton href="/training-competency/review-approval/rules" variant="secondary">Rules</TrainingButton>
        <TrainingButton href="/training-competency/review-approval/settings" variant="secondary">Settings</TrainingButton>
        {onRefresh ? <TrainingButton variant="secondary" onClick={onRefresh}>Refresh</TrainingButton> : null}
      </div>
    </header>
  );
}
