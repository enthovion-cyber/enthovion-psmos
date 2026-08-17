import { TrainingButton } from '../shared/TrainingUi';

export function TrainingDashboardHeader({ header }: { header?: Record<string, any> }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Training & Competency</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--psm-fg)]">{header?.title ?? 'Training & Competency'}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{header?.subtitle ?? 'Workforce competency foundation for safety-critical work.'}</p>
        <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated: {header?.lastUpdated ? new Date(header.lastUpdated).toLocaleString() : 'Not loaded'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <TrainingButton href="/training-competency/workforce/new">Create Worker</TrainingButton>
        <TrainingButton href="/training-competency/workforce" variant="secondary">Open Workforce</TrainingButton>
        <TrainingButton href="/training-competency/settings" variant="secondary">Settings</TrainingButton>
      </div>
    </div>
  );
}
