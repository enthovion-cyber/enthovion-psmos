import { RegulatoryMetricCard } from '../shared/RegulatoryUi';

export function RegulatoryApplicabilitySummaryCards({ summary }: { summary?: Record<string, any> | undefined }) {
  const cards = [
    ['Total Assessments', summary?.totalApplicabilityAssessments, '/regulatory/applicability/assessments', 'neutral'],
    ['Not Assessed', summary?.notAssessed, '/regulatory/applicability/not-assessed', 'warn'],
    ['Applicable', summary?.applicable, '/regulatory/applicability/applicable', 'good'],
    ['Partially Applicable', summary?.partiallyApplicable, '/regulatory/applicability/partially-applicable', 'warn'],
    ['Not Applicable', summary?.notApplicable, '/regulatory/applicability/not-applicable', 'neutral'],
    ['Under Review', summary?.underReview, '/regulatory/applicability/under-review', 'info'],
    ['Stale Applicability', summary?.staleApplicability, '/regulatory/applicability/stale', 'danger'],
    ['Missing Rationale', summary?.missingRationale, '/regulatory/applicability/missing-rationale', 'danger'],
    ['Review Overdue', summary?.reviewOverdue, undefined, 'danger'],
    ['Assessments With Gaps', summary?.assessmentsWithGaps, '/regulatory/applicability/gaps', 'warn']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, href, tone]) => <RegulatoryMetricCard key={label} label={label} value={value ?? 0} href={href} tone={tone as any} />)}</div>;
}
