import { RegulatoryMetricCard } from '../shared/RegulatoryUi';
import type { RegulatoryReviewSummary } from '../types/regulatory-review.types';

export function RegulatoryReviewSummaryCards({ summary }: { summary?: RegulatoryReviewSummary | undefined }) {
  const cards = [
    ['Total Review Packages', summary?.totalReviewPackages ?? 0, '/regulatory/review-approval/packages', 'info'],
    ['Pending My Review', summary?.pendingMyReview ?? 0, '/regulatory/review-approval/inbox', 'warn'],
    ['My Submissions', summary?.mySubmissions ?? 0, '/regulatory/review-approval/my-submissions', 'neutral'],
    ['Pending Review', summary?.pendingReview ?? 0, '/regulatory/review-approval/pending', 'warn'],
    ['Overdue Reviews', summary?.overdueReviews ?? 0, '/regulatory/review-approval/overdue', 'danger'],
    ['Returned For Correction', summary?.returnedForCorrection ?? 0, '/regulatory/review-approval/returned', 'warn'],
    ['Rejected', summary?.rejected ?? 0, '/regulatory/review-approval/rejected', 'danger'],
    ['Approved', summary?.approved ?? 0, '/regulatory/review-approval/approved', 'good'],
    ['Approved With Conditions', summary?.approvedWithConditions ?? 0, '/regulatory/review-approval/approved-with-conditions', 'good'],
    ['Stale Packages', summary?.stalePackages ?? 0, '/regulatory/review-approval/stale', 'danger'],
    ['Validation Failures', summary?.validationFailures ?? 0, '/regulatory/review-approval/validation-failures', 'danger'],
    ['E-Signatures Pending', summary?.eSignaturesPending ?? 0, '/regulatory/review-approval/e-signatures', 'warn'],
    ['Conditions Open', summary?.conditionsOpen ?? 0, '/regulatory/review-approval/approved-with-conditions', 'warn'],
    ['Critical Reviews Pending', summary?.criticalReviewsPending ?? 0, '/regulatory/review-approval/pending', 'danger']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, href, tone]) => <RegulatoryMetricCard key={label} label={label} value={value} href={href} tone={tone} />)}</div>;
}
