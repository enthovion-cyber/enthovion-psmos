import { RegulatoryMetricCard } from '../shared/RegulatoryUi';

const cards = [
  ['Total Assessments', 'totalComplianceAssessments', 'info', '/regulatory/compliance-status/register'],
  ['Completed', 'completed', 'good', '/regulatory/compliance-status/compliant'],
  ['Non-Compliant', 'nonCompliantFoundation', 'danger', '/regulatory/compliance-status/non-compliant'],
  ['Partially Compliant', 'partiallyCompliantFoundation', 'warn', '/regulatory/compliance-status/partially-compliant'],
  ['Evidence Missing', 'evidenceMissing', 'danger', '/regulatory/compliance-status/evidence-missing'],
  ['Action Required', 'actionRequired', 'warn', '/regulatory/compliance-status/action-required'],
  ['CAPA Open', 'capaOpen', 'warn', '/regulatory/compliance-status/capa-open'],
  ['Review Required', 'reviewRequired', 'warn', '/regulatory/compliance-status/review-required'],
  ['Stale', 'staleComplianceStatus', 'warn', '/regulatory/compliance-status/stale'],
  ['Open Gaps', 'openGaps', 'danger', '/regulatory/compliance-status/gaps'],
  ['Critical Gaps', 'criticalGaps', 'danger', '/regulatory/compliance-status/gaps'],
  ['Manual Declarations', 'manualDeclarations', 'neutral', '/regulatory/compliance-status/register']
] as const;

export function RegulatoryComplianceSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, key, tone, href]) => <RegulatoryMetricCard key={key} label={label} value={summary?.[key] ?? 0} tone={tone} href={href} />)}
    </div>
  );
}
