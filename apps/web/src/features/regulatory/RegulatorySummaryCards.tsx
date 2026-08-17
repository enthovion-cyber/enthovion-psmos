import { RegulatoryMetricCard } from './shared/RegulatoryUi';

const cards: Array<[string, string, string, 'neutral' | 'good' | 'warn' | 'danger' | 'info']> = [
  ['totalRegisterItems', 'Total Register Items', '/regulatory/register', 'info'],
  ['activeRequirements', 'Active Requirements', '/regulatory/active', 'good'],
  ['draftRequirements', 'Draft Requirements', '/regulatory/draft', 'neutral'],
  ['underReview', 'Under Review', '/regulatory/under-review', 'warn'],
  ['notApplicable', 'Not Applicable', '/regulatory/not-applicable', 'neutral'],
  ['superseded', 'Superseded', '/regulatory/superseded', 'neutral'],
  ['archived', 'Archived', '/regulatory/archived', 'danger'],
  ['highRisk', 'High Risk', '/regulatory/high-risk', 'warn'],
  ['safetyCritical', 'Safety-Critical', '/regulatory/safety-critical', 'danger'],
  ['environmentalCritical', 'Environmental-Critical', '/regulatory/environmental-critical', 'danger'],
  ['psmCritical', 'PSM-Critical', '/regulatory/psm-critical', 'danger'],
  ['missingOwner', 'Missing Owner', '/regulatory/missing-owner', 'warn'],
  ['missingApplicability', 'Missing Applicability', '/regulatory/missing-applicability', 'warn'],
  ['missingEvidence', 'Missing Evidence', '/regulatory/missing-evidence', 'warn'],
  ['nonCompliantFoundation', 'Non-Compliant Foundation', '/regulatory/non-compliant', 'danger'],
  ['partiallyCompliantFoundation', 'Partially Compliant Foundation', '/regulatory/register?complianceStatus=Partially%20Compliant%20Foundation', 'warn'],
  ['compliantFoundation', 'Compliant Foundation', '/regulatory/register?complianceStatus=Compliant%20Foundation', 'good'],
  ['reviewOverdue', 'Review Overdue', '/regulatory/overdue-review', 'danger'],
  ['reviewDueSoon', 'Review Due Soon', '/regulatory/overdue-review', 'warn'],
  ['effectiveSoon', 'Effective Soon', '/regulatory/effective-soon', 'warn'],
  ['recentlyAdded', 'Recently Added', '/regulatory/register?sort=created_at.desc', 'info'],
  ['recentlyUpdated', 'Recently Updated', '/regulatory/register?sort=updated_at.desc', 'info'],
  ['linkedToAudit', 'Linked To Audit', '/regulatory/audit-mapping', 'info'],
  ['linkedToEvidence', 'Linked To Evidence', '/regulatory/evidence', 'info'],
  ['linkedToActionsCapa', 'Linked To Actions / CAPA', '/regulatory/actions', 'info'],
  ['pendingReviewApprovalFoundation', 'Pending Review / Approval Foundation', '/regulatory/review-approval', 'warn']
];

export function RegulatorySummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
      {cards.map(([key, label, href, tone]) => <RegulatoryMetricCard key={key} label={label} value={summary?.[key] ?? 0} href={href} tone={tone} />)}
    </div>
  );
}
