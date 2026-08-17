import { TrainingCard } from '../../shared/TrainingUi';

export function TrainingMatrixGapLifecyclePanel({ gap }: { gap?: Record<string, any> }) {
  const events = ['Open', 'Assigned', 'Action Created', 'Waiting Evidence', 'Waiting Verification', 'Waiver Requested', 'Resolved', 'Verified', 'Closed'];
  return <TrainingCard title="Gap Lifecycle" subtitle="Closing safety-critical gaps requires evidence or approved waiver; action closure alone does not close the gap."><div className="flex flex-wrap gap-2">{events.map((event) => <span key={event} className={`rounded-full border px-3 py-1 text-xs font-semibold ${gap?.gap_status === event ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--psm-line)] text-[var(--psm-muted)]'}`}>{event}</span>)}</div></TrainingCard>;
}
