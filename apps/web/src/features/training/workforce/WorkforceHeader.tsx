import { TrainingButton } from '../shared/TrainingUi';

export function WorkforceHeader({ total }: { total?: number }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Workforce / Employees</p>
        <h1 className="mt-2 text-3xl font-bold">Workforce Registry</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">{total ?? 0} scoped workers. Employees, contractors, vendors, trainees, visitors, and auditors are maintained here.</p>
      </div>
      <div className="flex gap-2">
        <TrainingButton href="/training-competency/workforce/new">Create Worker</TrainingButton>
        <TrainingButton href="/training-competency/dashboard" variant="secondary">Dashboard</TrainingButton>
      </div>
    </div>
  );
}
