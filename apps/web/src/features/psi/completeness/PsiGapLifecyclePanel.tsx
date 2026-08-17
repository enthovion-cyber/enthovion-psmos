import { PsiCard } from '../shared/PsiUi';

export function PsiGapLifecyclePanel() {
  const steps = ['Open', 'Assigned', 'Action Created', 'In Progress', 'Waiting Review', 'Resolved', 'Verified', 'Closed'];
  return <PsiCard title="Gap Lifecycle" subtitle="All transitions are backend-controlled and audit/history logged."><div className="grid gap-2 sm:grid-cols-4">{steps.map((step, index) => <div key={step} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs text-[var(--psm-muted)]">Step {index + 1}</p><p className="font-semibold">{step}</p></div>)}</div></PsiCard>;
}
