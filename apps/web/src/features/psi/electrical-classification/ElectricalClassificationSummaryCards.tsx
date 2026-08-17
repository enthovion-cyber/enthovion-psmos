import { PsiMetricCard } from '../shared/PsiUi';
import type { ElectricalSummary } from '../types/electrical-classification.types';

export function ElectricalClassificationSummaryCards({ summary }: { summary: ElectricalSummary }) {
  const cards = [
    ['Total Classified Areas', summary.totalClassifiedAreas, 'neutral'],
    ['Zone 0 / 1 / 2', summary.zoneAreas, 'neutral'],
    ['Class I Div 1 / 2', summary.classDivisionAreas, 'neutral'],
    ['Dust Classified Areas', summary.dustClassifiedAreas, 'neutral'],
    ['Unclassified Review', summary.unclassifiedAreasWithReview, 'warn'],
    ['Missing Studies', summary.missingClassificationStudies, 'danger'],
    ['Missing Drawings', summary.missingAreaDrawings, 'danger'],
    ['Rating Mismatches', summary.equipmentRatingMismatches, 'danger'],
    ['Missing Ex Rating', summary.instrumentsMissingExRating, 'danger'],
    ['Hot Work Restricted', summary.hotWorkRestrictedAreas, 'warn'],
    ['Ventilation Basis Missing', summary.ventilationBasisMissing, 'danger'],
    ['Release Source Missing', summary.releaseSourceMissing, 'danger'],
    ['Review Overdue', summary.reviewOverdue, 'danger'],
    ['Pending Approval', summary.pendingApproval, 'warn'],
    ['MOC Required', summary.mocRequired, 'warn'],
    ['PSSR Blockers', summary.pssrBlockers, 'danger'],
    ['Audit Gaps', summary.auditGaps, 'danger']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{cards.map(([label, value, tone]) => <PsiMetricCard key={label} label={label} value={value} tone={tone} />)}</div>;
}
