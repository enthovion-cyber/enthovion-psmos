import Link from 'next/link';
import { MatrixStatusBadge } from '../shared/MatrixStatusBadge';

export function TrainingMatrixMobileCards({ rows = [] }: { rows?: Record<string, any>[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((row) => <Link key={row.worker?.id} href={`/training-competency/workforce/${row.worker?.id}/training-matrix`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.worker?.display_name}</p><p className="text-xs text-[var(--psm-muted)]">{row.worker?.job_title ?? 'Missing role'} / {row.worker?.worker_type}</p></div><MatrixStatusBadge value={row.summary?.overall_matrix_status} /></div><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><span>Required: <b>{row.summary?.total_required ?? 0}</b></span><span>Missing: <b>{row.summary?.missing_evidence_count ?? 0}</b></span><span>Blockers: <b>{(row.summary?.ptw_blocker_count ?? 0) + (row.summary?.moc_blocker_count ?? 0) + (row.summary?.pssr_blocker_count ?? 0)}</b></span></div></Link>)}</div>;
}
