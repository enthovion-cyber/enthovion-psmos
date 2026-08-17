import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function EscalatedApprovalPanel({ rows }: { rows?: MiApprovalInstance[] }) {
  const escalated = rows?.filter((row) => row.status === 'Escalated' || /critical/i.test(String(row.priority))).slice(0, 6) ?? [];
  return (
    <ReviewCard title="Safety-Critical / Escalated" description="Items that need management, HSE, or functional safety attention.">
      {!escalated.length ? <EmptyPanel>No escalated safety-critical approvals in this view.</EmptyPanel> : <ul className="space-y-2 text-sm">{escalated.map((row) => <li key={row.id} className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning">{row.approval_number} - {row.source_module}</li>)}</ul>}
    </ReviewCard>
  );
}
