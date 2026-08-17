import { PsiMetricCard } from '../shared/PsiUi';
import type { MaterialCompatibilitySummary } from '../types/material-compatibility.types';

const cards = [
  ['Total Compatibility Records', 'totalRecords'],
  ['Compatible Records', 'compatibleRecords', 'good'],
  ['Compatible With Conditions', 'conditionalRecords', 'warn'],
  ['Incompatible Records', 'incompatibleRecords', 'danger'],
  ['Needs Engineering Review', 'engineeringReviewRecords', 'warn'],
  ['Unknown / Missing Data', 'unknownRecords', 'warn'],
  ['Critical Incompatibilities', 'criticalIncompatibilities', 'danger'],
  ['Equipment / Chemical Gaps', 'equipmentChemicalGaps', 'warn'],
  ['Corrosive Service', 'corrosiveService', 'warn'],
  ['Elastomer / Seal Risks', 'elastomerSealRisks', 'warn'],
  ['Lining / Coating Risks', 'liningCoatingRisks', 'warn'],
  ['SCC / Embrittlement Risks', 'sccEmbrittlementRisks', 'danger'],
  ['High Temp Risks', 'highTemperatureRisks', 'warn'],
  ['Concentration Limit Risks', 'concentrationLimitRisks', 'warn'],
  ['pH Limit Risks', 'phLimitRisks', 'warn'],
  ['MI Readiness Impact', 'miReadinessImpact', 'warn'],
  ['PSSR Blockers', 'pssrBlockers', 'danger'],
  ['MOC Required', 'mocRequired', 'warn'],
  ['Review Overdue', 'reviewOverdue', 'danger'],
  ['Pending Approval', 'pendingApproval', 'warn']
] as const;

export function MaterialCompatibilitySummaryCards({ summary }: { summary: MaterialCompatibilitySummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, key, tone]) => <PsiMetricCard key={key} label={label} value={summary[key] ?? 0} tone={(tone ?? 'neutral') as any} href={key === 'pssrBlockers' ? '/process-safety-information/material-compatibility/pssr-blockers' : key === 'mocRequired' ? '/process-safety-information/material-compatibility/moc-required' : key === 'reviewOverdue' ? '/process-safety-information/material-compatibility/review-overdue' : undefined} />)}</div>;
}

