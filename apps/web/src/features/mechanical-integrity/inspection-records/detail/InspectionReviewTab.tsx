import { InspectionReviewSubmitSection } from '../sections/InspectionReviewSubmitSection';
import type { MiInspectionReview } from '../../types/inspection-record.types';

export function InspectionReviewTab({ reviews, blockers, warnings, readOnlyReason, onSubmit, onApprove, onReject, saving }: { reviews: MiInspectionReview[]; blockers?: string[] | undefined; warnings?: string[] | undefined; readOnlyReason?: string | null | undefined; onSubmit: () => void; onApprove: () => void; onReject: () => void; saving?: boolean | undefined }) {
  return (
    <div className="space-y-4">
      <InspectionReviewSubmitSection blockers={blockers} warnings={warnings} readOnlyReason={readOnlyReason} onSubmit={onSubmit} onApprove={onApprove} onReject={onReject} saving={saving} />
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <h2 className="font-bold text-[var(--psm-text)]">Review History</h2>
        <div className="mt-4 grid gap-2">{reviews.length ? reviews.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span className="font-semibold text-[var(--psm-text)]">{row.review_action}</span><span className="ml-2 text-[var(--psm-muted)]">{row.review_comments ?? 'No comments'} • {row.created_at ?? '-'}</span></div>) : <p className="text-sm text-[var(--psm-muted)]">No review activity yet.</p>}</div>
      </section>
    </div>
  );
}
