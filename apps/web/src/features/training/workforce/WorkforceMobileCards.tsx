import Link from 'next/link';
import type { Worker } from '../types/training.types';
import { TrainingStatusBadge } from '../shared/TrainingStatusBadge';
import { WorkerTypeBadge } from '../shared/WorkerTypeBadge';

export function WorkforceMobileCards({ rows = [] }: { rows?: Worker[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((worker) => <Link key={worker.id} href={`/training-competency/workforce/${worker.id}`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{worker.display_name}</p><p className="text-xs text-[var(--psm-muted)]">{worker.work_email ?? worker.employee_id ?? worker.contractor_id ?? 'No identifier display'}</p></div><WorkerTypeBadge type={worker.worker_type} /></div><div className="mt-3 flex flex-wrap gap-2"><TrainingStatusBadge status={worker.training_status} /><span className="text-xs text-[var(--psm-muted)]">{worker.primarySite?.name ?? 'Missing site'}</span><span className="text-xs text-[var(--psm-muted)]">{worker.job_title ?? 'Missing role'}</span></div></Link>)}</div>;
}
