import { TrainingButton } from '../shared/TrainingUi';

export function TrainingMatrixHeader({ title = 'Training Matrix', subtitle = 'Required training, evidence gaps, blockers, waivers, and matrix evaluations.', onRun }: { title?: string; subtitle?: string; onRun?: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Training & Competency</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <TrainingButton href="/training-competency/training-matrix/rules/new">New Rule</TrainingButton>
        <TrainingButton href="/training-competency/training-matrix/gaps" variant="secondary">View Gaps</TrainingButton>
        <TrainingButton href="/training-competency/training-matrix/run-history" variant="secondary">Run History</TrainingButton>
        {onRun ? <TrainingButton onClick={onRun} title="Run backend matrix evaluation for your allowed scope">Run Evaluation</TrainingButton> : null}
      </div>
    </div>
  );
}
