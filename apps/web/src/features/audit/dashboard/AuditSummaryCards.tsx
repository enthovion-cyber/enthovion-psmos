import { AuditMetricCard } from '../shared/AuditUi';

const cards = [
  ['Total Audit Programs', 'totalAuditPrograms', 'info', '/audit-compliance/programs'],
  ['Active Programs', 'activePrograms', 'good', '/audit-compliance/programs?programStatus=Active'],
  ['Draft Programs', 'draftPrograms', 'neutral', '/audit-compliance/programs?programStatus=Draft'],
  ['Inactive Programs', 'inactivePrograms', 'neutral', '/audit-compliance/programs?programStatus=Inactive'],
  ['Archived Programs', 'archivedPrograms', 'neutral', '/audit-compliance/programs?programStatus=Archived'],
  ['Programs Pending Review', 'programsPendingReview', 'warn', '/audit-compliance/programs?programStatus=Pending Review'],
  ['Programs Review Overdue', 'programsReviewOverdue', 'danger', '/audit-compliance/programs?programStatus=Review Overdue'],
  ['Programs Missing Owner', 'programsMissingOwner', 'danger', '/audit-compliance/programs?health=Missing Owner'],
  ['Programs Missing Scope', 'programsMissingScope', 'danger', '/audit-compliance/programs?health=Missing Scope'],
  ['Programs Missing Standards', 'programsMissingStandards', 'danger', '/audit-compliance/programs?health=Missing Standards'],
  ['Programs Missing Frequency', 'programsMissingFrequency', 'danger', '/audit-compliance/programs?health=Missing Frequency'],
  ['Sites Covered', 'sitesCovered', 'good', '/audit-compliance/programs'],
  ['Sites Without Audit Program', 'sitesWithoutAuditProgram', 'warn', '/audit-compliance/dashboard'],
  ['Units Covered', 'unitsCovered', 'good', '/audit-compliance/programs'],
  ['Units Without Audit Program', 'unitsWithoutAuditProgram', 'warn', '/audit-compliance/dashboard'],
  ['PSM Modules Covered', 'psmModulesCovered', 'good', '/audit-compliance/programs'],
  ['PSM Modules Without Audit Coverage', 'psmModulesWithoutAuditCoverage', 'warn', '/audit-compliance/dashboard'],
  ['Safety-Critical Programs', 'safetyCriticalPrograms', 'danger', '/audit-compliance/programs?criticality=Safety-Critical'],
  ['Regulatory-Critical Programs', 'regulatoryCriticalPrograms', 'danger', '/audit-compliance/programs?criticality=Regulatory-Critical'],
  ['PSM-Critical Programs', 'psmCriticalPrograms', 'danger', '/audit-compliance/programs?criticality=PSM-Critical'],
  ['Ready For Scheduling', 'readyForScheduling', 'good', '/audit-compliance/programs?readyForScheduling=true']
] as const;

export function AuditSummaryCards({ summary }: { summary: Record<string, number> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">{cards.map(([label, key, tone, href]) => <AuditMetricCard key={key} label={label} value={summary?.[key] ?? 0} tone={tone} href={href} />)}</div>;
}
