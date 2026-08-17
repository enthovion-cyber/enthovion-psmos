import Link from 'next/link';
import { EvidenceStatusBadge } from '../../shared/EvidenceStatusBadge';
import { MOCTrainingBlockerBadge } from '../../shared/MOCTrainingBlockerBadge';
import { PSSRTrainingBlockerBadge } from '../../shared/PSSRTrainingBlockerBadge';
import { PTWBlockerBadge } from '../../shared/PTWBlockerBadge';
import { TrainingGapSeverityBadge } from '../../shared/TrainingGapSeverityBadge';
import { TrainingGapStatusBadge } from '../../shared/TrainingGapStatusBadge';
import { TrainingEmptyState } from '../../shared/TrainingUi';

export function TrainingMatrixGapTable({ rows = [], compact = false }: { rows?: Record<string, any>[]; compact?: boolean }) {
  if (!rows.length) return <TrainingEmptyState title="No training gaps" message="No gaps match this view, or matrix evaluation has not generated requirements yet." />;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]"><table className="min-w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{['Gap','Training','Type','Severity','Status','Due','Evidence','PTW','MOC','PSSR','Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="max-w-xs px-3 py-3 font-semibold">{row.gap_title}<div className="text-xs text-[var(--psm-muted)]">Worker: {row.worker_id}</div></td><td className="px-3 py-3">{row.training_title}<div className="text-xs text-[var(--psm-muted)]">{row.training_code}</div></td><td className="px-3 py-3">{row.gap_type}</td><td className="px-3 py-3"><TrainingGapSeverityBadge value={row.gap_severity} /></td><td className="px-3 py-3"><TrainingGapStatusBadge value={row.gap_status} /></td><td className="px-3 py-3">{row.due_date ?? 'Not set'}</td><td className="px-3 py-3"><EvidenceStatusBadge value={row.evidence_found === 'No evidence found' ? 'Missing Evidence' : row.evidence_found} /></td><td className="px-3 py-3"><PTWBlockerBadge value={row.ptw_blocker} /></td><td className="px-3 py-3"><MOCTrainingBlockerBadge value={row.moc_blocker} /></td><td className="px-3 py-3"><PSSRTrainingBlockerBadge value={row.pssr_blocker} /></td><td className="px-3 py-3">{compact ? <Link className="font-semibold text-primary" href="/training-competency/training-matrix/gaps">Open</Link> : <Link className="font-semibold text-primary" href={`/training-competency/training-matrix/gaps?selected=${row.id}`}>Details</Link>}</td></tr>)}</tbody></table></div>;
}
