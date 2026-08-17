import Link from 'next/link';
import { ApprovalPriorityBadge } from '../shared/ApprovalPriorityBadge';
import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { ValidationStatusBadge } from '../shared/ValidationStatusBadge';
import { ReviewButton } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function ApprovalMobileCards({ rows }: { rows?: MiApprovalInstance[] }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-3 xl:hidden">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{row.approval_number}</p>
              <p className="text-sm text-[var(--psm-muted)]">{row.source_module} - {row.source_record_number ?? row.source_record_id}</p>
            </div>
            <ApprovalStatusBadge status={row.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ApprovalPriorityBadge priority={row.priority} />
            <ValidationStatusBadge status={row.last_validation_status} />
          </div>
          <div className="mt-4">
            <Link href={`/mechanical-integrity/review-approval/${row.id}`}><ReviewButton>Open Approval</ReviewButton></Link>
          </div>
        </article>
      ))}
    </div>
  );
}
