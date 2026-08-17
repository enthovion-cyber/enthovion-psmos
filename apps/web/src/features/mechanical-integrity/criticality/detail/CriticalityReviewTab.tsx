'use client';

import { ReviewSubmitSection } from '../assessment/sections/ReviewSubmitSection';
import type { CriticalityAssessmentDetail } from '../../types/criticality.types';

export function CriticalityReviewTab({ detail, onSubmit, saving }: { detail: CriticalityAssessmentDetail; onSubmit: () => void; saving?: boolean }) {
  return (
    <div className="space-y-4">
      <ReviewSubmitSection validation={detail.validation} saving={saving} onSubmit={onSubmit} />
      <div className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Review History</h2><div className="mt-3 space-y-2 text-sm">{detail.reviews.length ? detail.reviews.map((review) => <div key={String(review.id)} className="rounded-md border border-border p-3">{String(review.review_action)} - {String(review.review_comments ?? '')}</div>) : <div className="text-muted-foreground">No review records yet.</div>}</div></div>
    </div>
  );
}
