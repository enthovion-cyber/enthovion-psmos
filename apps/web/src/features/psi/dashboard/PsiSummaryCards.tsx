import { PsiMetricCard } from '../shared/PsiUi';

const cards: Array<[string, string, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
  ['Total Process Units', 'totalProcessUnits', '/process-safety-information/units', 'neutral'],
  ['PSI Complete Units', 'psiCompleteUnits', '/process-safety-information/units?completenessStatus=Complete', 'good'],
  ['PSI Incomplete Units', 'psiIncompleteUnits', '/process-safety-information/units?completenessStatus=Incomplete', 'warn'],
  ['Units With Critical PSI Gaps', 'unitsWithCriticalPsiGaps', '/process-safety-information/units?criticalGaps=true', 'danger'],
  ['Units Review Overdue', 'unitsReviewOverdue', '/process-safety-information/units?reviewOverdue=true', 'danger'],
  ['MOC Updates Required', 'mocUpdatesRequired', '/process-safety-information/units?mocUpdateRequired=true', 'warn'],
  ['PSSR Blockers From PSI', 'pssrBlockersFromPsi', '/process-safety-information/units?pssrBlocker=true', 'danger'],
  ['Units Missing Chemicals/SDS', 'unitsMissingChemicalsSds', '/process-safety-information/units', 'warn'],
  ['Units Missing Process Chemistry', 'unitsMissingProcessChemistry', '/process-safety-information/units', 'warn'],
  ['Units Missing Safe Operating Limits', 'unitsMissingSafeOperatingLimits', '/process-safety-information/units', 'warn'],
  ['Units Missing Equipment Design Basis', 'unitsMissingEquipmentDesignBasis', '/process-safety-information/units', 'warn'],
  ['Units Missing Relief Basis', 'unitsMissingReliefBasis', '/process-safety-information/units', 'warn'],
  ['Units Missing P&IDs/Drawings', 'unitsMissingDrawings', '/process-safety-information/units', 'warn'],
  ['Units Missing Safeguard Basis', 'unitsMissingSafeguardBasis', '/process-safety-information/units', 'warn'],
  ['Documents Pending Approval', 'documentsPendingApproval', '/documents', 'warn'],
  ['Recently Updated PSI', 'recentlyUpdatedPsi', '/process-safety-information/change-history', 'neutral']
];

export function PsiSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, href, tone]) => <PsiMetricCard key={key} label={label} value={summary?.[key] ?? 0} href={href} tone={tone} />)}</div>;
}
