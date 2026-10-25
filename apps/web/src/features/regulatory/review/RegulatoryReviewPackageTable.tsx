import Link from 'next/link';
import { RegulatoryReviewESignBadge } from '../shared/RegulatoryReviewESignBadge';
import { RegulatoryReviewSlaBadge } from '../shared/RegulatoryReviewSlaBadge';
import { RegulatoryReviewStaleBadge } from '../shared/RegulatoryReviewStaleBadge';
import { RegulatoryReviewStatusBadge } from '../shared/RegulatoryReviewStatusBadge';
import { RegulatoryReviewValidationBadge } from '../shared/RegulatoryReviewValidationBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';
import type { RegulatoryReviewPackage } from '../types/regulatory-review.types';

export function RegulatoryReviewPackageTable({ rows }: { rows?: RegulatoryReviewPackage[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No review packages" message="No regulatory review packages match the current scope and filters." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
          <tr>
            {['Package', 'Source', 'Scope', 'Review Status', 'Validation', 'Stale', 'E-Sign', 'SLA', 'Submitted', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)] bg-[var(--psm-surface)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3">
                <Link href={`/regulatory/review-approval/packages/${row.id}`} className="font-semibold text-primary hover:underline">{row.package_code ?? row.id}</Link>
                <p className="mt-1 max-w-xs text-[var(--psm-muted)]">{row.package_title ?? 'Untitled package'}</p>
              </td>
              <td className="px-4 py-3"><span className="font-medium text-[var(--psm-fg)]">{row.source_type ?? 'Source'}</span><p className="text-[var(--psm-muted)]">{row.source_record_number ?? row.source_record_id}</p></td>
              <td className="px-4 py-3 text-[var(--psm-muted)]">{row.site_id ?? 'Company-wide'}</td>
              <td className="px-4 py-3"><RegulatoryReviewStatusBadge status={row.review_status} /></td>
              <td className="px-4 py-3"><RegulatoryReviewValidationBadge status={row.validation_status} /></td>
              <td className="px-4 py-3"><RegulatoryReviewStaleBadge status={row.stale_status} /></td>
              <td className="px-4 py-3"><RegulatoryReviewESignBadge status={row.e_signature_status} /></td>
              <td className="px-4 py-3"><RegulatoryReviewSlaBadge dueDate={row.due_date} completedAt={row.completed_at} /></td>
              <td className="px-4 py-3 text-[var(--psm-muted)]">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : 'Not submitted'}</td>
              <td className="px-4 py-3"><Link href={`/regulatory/review-approval/packages/${row.id}`} className="text-primary hover:underline">Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
