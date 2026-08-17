import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';
import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function MyApprovalInbox({ rows }: { rows?: MiApprovalInstance[] }) {
  const mine = rows?.filter((row) => ['Submitted','Pending Approval','In Review','More Information Requested','Delegated','Escalated'].includes(String(row.status))).slice(0, 5) ?? [];
  return (
    <ReviewCard title="My Approval Inbox" description="Approvals requiring reviewer action, e-signature, delegation, or more information.">
      {!mine.length ? <EmptyPanel>No assigned approvals are pending.</EmptyPanel> : (
        <div className="space-y-3">
          {mine.map((row) => (
            <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.approval_number}</p>
                  <p className="text-sm text-[var(--psm-muted)]">{row.source_module} - {cardValue(row.source_record_number ?? row.source_record_id)}</p>
                </div>
                <ApprovalStatusBadge status={row.status} />
              </div>
              <p className="mt-2 text-xs text-[var(--psm-muted)]">Due {cardValue(row.due_at, 'No due date')}</p>
            </div>
          ))}
        </div>
      )}
    </ReviewCard>
  );
}
