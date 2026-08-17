import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function OverdueApprovalPanel({ rows }: { rows?: MiApprovalInstance[] }) {
  const now = Date.now();
  const overdue = rows?.filter((row) => row.due_at && new Date(row.due_at).getTime() < now && !/Approved|Rejected|Completed|Cancelled/.test(String(row.status))).slice(0, 6) ?? [];
  return (
    <ReviewCard title="Overdue Approvals" description="Approvals beyond configured due duration.">
      {!overdue.length ? <EmptyPanel>No overdue approvals in the current view.</EmptyPanel> : <ul className="space-y-2 text-sm">{overdue.map((row) => <li key={row.id} className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger">{row.approval_number} due {new Date(row.due_at as string).toLocaleDateString()}</li>)}</ul>}
    </ReviewCard>
  );
}
