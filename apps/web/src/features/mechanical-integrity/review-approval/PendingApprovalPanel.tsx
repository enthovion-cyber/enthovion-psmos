import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function PendingApprovalPanel({ rows }: { rows?: MiApprovalInstance[] }) {
  const pending = rows?.filter((row) => /Submitted|Pending|Review|Requested/.test(String(row.status))).slice(0, 6) ?? [];
  return (
    <ReviewCard title="Pending Approvals" description="Records currently inside the workflow route.">
      {!pending.length ? <EmptyPanel>No pending approvals found.</EmptyPanel> : <ul className="space-y-2 text-sm">{pending.map((row) => <li key={row.id} className="flex justify-between gap-3 rounded-lg bg-[var(--psm-surface-2)] px-3 py-2"><span>{row.approval_number}</span><span className="text-[var(--psm-muted)]">{row.current_stage}</span></li>)}</ul>}
    </ReviewCard>
  );
}
