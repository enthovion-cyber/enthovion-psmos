import { RegulatoryMetricCard } from '../shared/RegulatoryUi';

export function RegulatoryEvidenceSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  const metrics = [
    ['Requirements', summary?.requirementsTotal ?? 0, '/regulatory/evidence/requirements', 'info'],
    ['Verified Evidence', summary?.evidenceVerified ?? 0, '/regulatory/evidence/verified', 'good'],
    ['Pending Review', summary?.evidencePendingReview ?? 0, '/regulatory/evidence/pending-review', 'warn'],
    ['Missing Evidence', summary?.evidenceMissing ?? 0, '/regulatory/evidence/missing', 'danger'],
    ['Open Requests', summary?.openRequests ?? 0, '/regulatory/evidence/requests', 'warn'],
    ['Open Gaps', summary?.openGaps ?? 0, '/regulatory/evidence/gaps', 'danger'],
    ['Restricted', summary?.evidenceRestricted ?? 0, '/regulatory/evidence/restricted', 'neutral'],
    ['Ready %', `${summary?.readinessPercent ?? 0}%`, '/regulatory/evidence/dashboard/by-readiness', 'good']
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, href, tone]) => <RegulatoryMetricCard key={label} label={label} value={value} href={href} tone={tone} />)}</div>;
}
