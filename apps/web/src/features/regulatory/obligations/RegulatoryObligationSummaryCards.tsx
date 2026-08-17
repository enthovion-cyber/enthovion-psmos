import { RegulatoryMetricCard } from '../shared/RegulatoryUi';

const cards: Array<[string, string, string, 'neutral' | 'good' | 'warn' | 'danger' | 'info']> = [
  ['Total Obligations', 'totalObligations', '/regulatory/obligations/register', 'info'],
  ['Active', 'activeObligations', '/regulatory/obligations/register?obligationStatus=Active', 'good'],
  ['Draft', 'draftObligations', '/regulatory/obligations/register?obligationStatus=Draft', 'neutral'],
  ['Applicable', 'applicableObligations', '/regulatory/obligations/applicable', 'good'],
  ['Not Applicable', 'notApplicableObligations', '/regulatory/obligations/not-applicable', 'neutral'],
  ['Missing Owner', 'missingOwner', '/regulatory/obligations/missing-owner', 'warn'],
  ['Missing Evidence', 'missingEvidenceExpectation', '/regulatory/obligations/missing-evidence', 'warn'],
  ['Missing Module Mapping', 'missingModuleMapping', '/regulatory/obligations/missing-module-mapping', 'warn'],
  ['Due Soon', 'dueSoon', '/regulatory/obligations/due-soon', 'warn'],
  ['Overdue', 'overdue', '/regulatory/obligations/overdue', 'danger'],
  ['PSM-Critical', 'psmCritical', '/regulatory/obligations/psm-critical', 'danger'],
  ['Stale', 'staleObligations', '/regulatory/obligations/stale', 'warn']
];

export function RegulatoryObligationSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, key, href, tone]) => <RegulatoryMetricCard key={key} label={label} value={summary?.[key] ?? 0} href={href} tone={tone} />)}
    </div>
  );
}
