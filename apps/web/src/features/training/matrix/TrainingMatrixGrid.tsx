import Link from 'next/link';
import { MatrixStatusBadge } from '../shared/MatrixStatusBadge';
import { TrainingEmptyState } from '../shared/TrainingUi';

export function TrainingMatrixGrid({ rows = [] }: { rows?: Record<string, any>[] }) {
  if (!rows.length) return <TrainingEmptyState title="No matrix rows" message="Run a matrix evaluation or create active matrix rules to generate worker requirements." />;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{['Worker','Site / Unit / Area','Job Role','Worker Type','Required','Complete','Incomplete','Overdue','Missing Evidence','Waived','PTW','MOC','PSSR','Overall','Last Evaluated','Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => {
          const worker = row.worker ?? {};
          const s = row.summary ?? {};
          return <tr key={worker.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold">{worker.display_name}<div className="text-xs text-[var(--psm-muted)]">{worker.work_email}</div></td><td className="px-3 py-3">{worker.primary_site_id ?? 'No site'}<div className="text-xs text-[var(--psm-muted)]">{worker.assignments?.[0]?.unit_id ?? 'No unit'} / {worker.assignments?.[0]?.area_id ?? 'No area'}</div></td><td className="px-3 py-3">{worker.job_title ?? worker.current_role_assignment?.job_role ?? 'Missing role'}</td><td className="px-3 py-3">{worker.worker_type}</td><td className="px-3 py-3">{s.total_required ?? 0}</td><td className="px-3 py-3">{s.complete_count ?? 0}</td><td className="px-3 py-3">{s.incomplete_count ?? 0}</td><td className="px-3 py-3">{s.overdue_count ?? 0}</td><td className="px-3 py-3">{s.missing_evidence_count ?? 0}</td><td className="px-3 py-3">{s.waived_count ?? 0}</td><td className="px-3 py-3">{s.ptw_blocker_count ?? 0}</td><td className="px-3 py-3">{s.moc_blocker_count ?? 0}</td><td className="px-3 py-3">{s.pssr_blocker_count ?? 0}</td><td className="px-3 py-3"><MatrixStatusBadge value={s.overall_matrix_status} /></td><td className="px-3 py-3">{s.evaluated_at ? new Date(s.evaluated_at).toLocaleString() : 'Not evaluated'}</td><td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/training-competency/workforce/${worker.id}/training-matrix`}>Open</Link></td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}
