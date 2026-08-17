import Link from 'next/link';
import { TrainingEmptyState } from '../shared/TrainingUi';
import { TrainingApprovalStatusBadge } from '../shared/TrainingApprovalStatusBadge';
import { TrainingApprovalPriorityBadge } from '../shared/TrainingApprovalPriorityBadge';
import { TrainingValidationStatusBadge } from '../shared/TrainingValidationStatusBadge';
import { TrainingStaleApprovalBadge } from '../shared/TrainingStaleApprovalBadge';
import { TrainingSlaStatusBadge } from '../shared/TrainingSlaStatusBadge';
import type { TrainingApprovalRow } from '../types/training-review-approval.types';

export function TrainingReviewInboxTable({ rows, title = 'Approval Packages' }: { rows?: TrainingApprovalRow[] | undefined; title?: string }) {
  if (!rows?.length) return <TrainingEmptyState title="No approvals found" message="No backend approval packages match this view and your current company/site access." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-[1180px] w-full text-left text-sm">
        <caption className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{title}</caption>
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Approval Package','Source Module','Source Record','Site / Unit / Area','Submitted By','Current Stage','Priority','Safety-Critical','Due Date','SLA','E-Signature','Validation','Stale','Package Status','Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
            <td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/training-competency/review-approval/packages/${row.id}`}>{row.approval_code ?? row.id}</Link><p className="text-xs text-[var(--psm-muted)]">{row.approval_title}</p></td>
            <td className="px-3 py-3">{row.source_module}</td>
            <td className="px-3 py-3">{row.source_record_title ?? row.source_record_type}<p className="text-xs text-[var(--psm-muted)]">{row.source_record_id}</p></td>
            <td className="px-3 py-3">{[row.site_id, row.unit_id, row.area_id].filter(Boolean).join(' / ') || 'Company'}</td>
            <td className="px-3 py-3">{row.submitted_by ?? '-'}</td>
            <td className="px-3 py-3">{row.current_stage_id ?? 'Route pending'}</td>
            <td className="px-3 py-3"><TrainingApprovalPriorityBadge value={row.priority} /></td>
            <td className="px-3 py-3">{row.safety_critical ? 'Yes' : 'No'}</td>
            <td className="px-3 py-3">{row.due_date ? new Date(row.due_date).toLocaleString() : '-'}</td>
            <td className="px-3 py-3"><TrainingSlaStatusBadge value={row.sla_status} /></td>
            <td className="px-3 py-3">{row.esign_required ? 'Required' : 'As configured'}</td>
            <td className="px-3 py-3"><TrainingValidationStatusBadge value={row.validation_status} /></td>
            <td className="px-3 py-3"><TrainingStaleApprovalBadge value={row.stale_status} /></td>
            <td className="px-3 py-3"><TrainingApprovalStatusBadge status={row.approval_status} /></td>
            <td className="px-3 py-3"><div className="flex flex-col gap-1"><Link className="text-primary" href={`/training-competency/review-approval/packages/${row.id}`}>Open</Link><Link className="text-primary" href={`/training-competency/review-approval/packages/${row.id}/review`}>Review</Link><Link className="text-primary" href={`/training-competency/review-approval/packages/${row.id}/snapshot`}>Snapshot</Link><Link className="text-primary" href={`/training-competency/review-approval/packages/${row.id}/evidence`}>Evidence</Link></div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
