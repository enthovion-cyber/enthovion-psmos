import Link from 'next/link';
import type { Worker } from '../types/training.types';
import { TrainingStatusBadge } from '../shared/TrainingStatusBadge';
import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';

export function TrainingOverduePreview({ workers = [], title = 'Overdue Training Preview' }: { workers?: Worker[]; title?: string }) {
  return (
    <TrainingCard title={title} subtitle="Safety-critical missing and overdue training signals from backend foundation statuses.">
      {!workers.length ? <TrainingEmptyState title="No workers returned" message="No records match this preview for your current scope." /> : <div className="space-y-2">{workers.map((worker) => <Link key={worker.id} href={`/training-competency/workforce/${worker.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm hover:bg-[var(--psm-surface-2)]"><span><span className="font-semibold">{worker.display_name}</span><span className="ml-2 text-[var(--psm-muted)]">{worker.job_title ?? worker.worker_type}</span></span><TrainingStatusBadge status={worker.training_status} /></Link>)}</div>}
    </TrainingCard>
  );
}
