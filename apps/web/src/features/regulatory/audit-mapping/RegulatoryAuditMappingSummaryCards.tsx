import { RegulatoryMetricCard } from '../shared/RegulatoryUi';
import { countOf } from './AuditMappingUi';

export function RegulatoryAuditMappingSummaryCards({ summary }: { summary?: Record<string, any> | undefined }) {
  const cards = [
    ['Total Mappings', countOf(summary, 'totalMappings'), '/regulatory/audit-mapping/register', 'info'],
    ['Active Mappings', countOf(summary, 'activeMappings'), '/regulatory/audit-mapping/register', 'neutral'],
    ['Verified', countOf(summary, 'verifiedMappings'), '/regulatory/audit-mapping/ready-for-audit', 'good'],
    ['Rejected', countOf(summary, 'rejectedMappings'), '/regulatory/audit-mapping/not-ready-for-audit', 'danger'],
    ['Stale', countOf(summary, 'staleMappings'), '/regulatory/audit-mapping/stale', 'warn'],
    ['Unmapped', countOf(summary, 'unmappedRequirements'), '/regulatory/audit-mapping/unmapped', 'danger'],
    ['Ready For Audit', countOf(summary, 'readyForAudit'), '/regulatory/audit-mapping/ready-for-audit', 'good'],
    ['Open Gaps', countOf(summary, 'openGaps'), '/regulatory/audit-mapping/gaps', 'warn'],
    ['Missing Checklist', countOf(summary, 'missingChecklist'), '/regulatory/audit-mapping/missing-checklist', 'danger'],
    ['Missing Evidence', countOf(summary, 'missingEvidence'), '/regulatory/audit-mapping/missing-evidence', 'danger'],
    ['Missing CAPA Link', countOf(summary, 'missingCapaLink'), '/regulatory/audit-mapping/missing-capa-link', 'warn'],
    ['Missing Score Link', countOf(summary, 'missingScoreLink'), '/regulatory/audit-mapping/missing-score-link', 'warn']
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, href, tone]) => <RegulatoryMetricCard key={label} label={label} value={value} href={href} tone={tone} />)}</div>;
}
