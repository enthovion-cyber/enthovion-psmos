import Link from 'next/link';
import { ApprovalPriorityBadge } from '../shared/ApprovalPriorityBadge';
import { ApprovalStageBadge } from '../shared/ApprovalStageBadge';
import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { ESignatureRequiredBadge } from '../shared/ESignatureRequiredBadge';
import { SafetyCriticalBadge } from '../shared/SafetyCriticalBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';
import { ValidationStatusBadge } from '../shared/ValidationStatusBadge';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';
import { ReviewButton } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function ApprovalTable({ rows }: { rows?: MiApprovalInstance[] }) {
  if (!rows?.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-sm text-[var(--psm-muted)]">No approvals match the current filters.</div>;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] xl:block">
      <table className="min-w-[1900px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {['Approval #','Source Module','Record #','Equipment','Status','Stage','Priority','Risk','Safety Critical','PSM Critical','Readiness','Startup','E-Sign','Validation','Submitted By','Due','Completed','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-4 py-3 font-semibold">{row.approval_number}</td>
              <td className="px-4 py-3">{row.source_module}</td>
              <td className="px-4 py-3">{cardValue(row.source_record_number ?? row.source_record_id)}</td>
              <td className="px-4 py-3">{cardValue(row.equipment_id)}</td>
              <td className="px-4 py-3"><ApprovalStatusBadge status={row.status} /></td>
              <td className="px-4 py-3"><ApprovalStageBadge stage={row.current_stage} /></td>
              <td className="px-4 py-3"><ApprovalPriorityBadge priority={row.priority} /></td>
              <td className="px-4 py-3">{cardValue(row.risk_level)}</td>
              <td className="px-4 py-3"><SafetyCriticalBadge value={row.safety_critical} /></td>
              <td className="px-4 py-3">{row.psm_critical ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">{row.readiness_impact ? 'Impacts readiness' : 'No impact'}</td>
              <td className="px-4 py-3"><StartupBlockedBadge blocked={row.startup_blocker} /></td>
              <td className="px-4 py-3"><ESignatureRequiredBadge required={row.e_signature_required} /></td>
              <td className="px-4 py-3"><ValidationStatusBadge status={row.last_validation_status} /></td>
              <td className="px-4 py-3">{cardValue(row.submitted_by)}</td>
              <td className="px-4 py-3">{cardValue(row.due_at)}</td>
              <td className="px-4 py-3">{cardValue(row.completed_at)}</td>
              <td className="px-4 py-3">
                <Link href={`/mechanical-integrity/review-approval/${row.id}`}><ReviewButton>Open</ReviewButton></Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
