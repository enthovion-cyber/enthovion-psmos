import type { PsiUnitDetailResponse } from '../../types/psi-unit.types';
import { PsiMetricCard, PsiCard } from '../../shared/PsiUi';
import { CompletenessScoreCard } from '../../completeness/CompletenessScoreCard';
import { MissingPsiItemsTable } from '../../completeness/MissingPsiItemsTable';

export function PsiUnitOverviewTab({ detail }: { detail: PsiUnitDetailResponse }) {
  const cards = detail.overview.cards;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PsiMetricCard label="PSI completeness score" value={`${Math.round(Number(cards.completenessScore ?? 0))}%`} />
        <PsiMetricCard label="Critical gaps" value={cards.criticalGaps ?? 0} tone={Number(cards.criticalGaps ?? 0) ? 'danger' : 'good'} />
        <PsiMetricCard label="Unit status" value={String(cards.unitStatus ?? 'Not set')} />
        <PsiMetricCard label="Review status" value={String(cards.reviewStatus ?? 'Not reviewed')} />
        <PsiMetricCard label="Next review due" value={String(cards.nextReviewDue ?? 'Not set')} />
        <PsiMetricCard label="Linked equipment count" value={cards.linkedEquipmentCount ?? 0} />
        <PsiMetricCard label="Critical equipment count" value={cards.criticalEquipmentCount ?? 0} />
        <PsiMetricCard label="Missing chemical/SDS count" value={cards.missingChemicalSdsCount ?? 0} tone={Number(cards.missingChemicalSdsCount ?? 0) ? 'warn' : 'good'} />
        <PsiMetricCard label="Missing SOL count" value={cards.missingSolCount ?? 0} tone={Number(cards.missingSolCount ?? 0) ? 'warn' : 'good'} />
        <PsiMetricCard label="Missing drawing count" value={cards.missingDrawingCount ?? 0} tone={Number(cards.missingDrawingCount ?? 0) ? 'warn' : 'good'} />
        <PsiMetricCard label="MOC update required count" value={cards.mocUpdateRequiredCount ?? 0} tone={Number(cards.mocUpdateRequiredCount ?? 0) ? 'warn' : 'good'} />
        <PsiMetricCard label="PSSR blocker count" value={cards.pssrBlockerCount ?? 0} tone={Number(cards.pssrBlockerCount ?? 0) ? 'danger' : 'good'} />
      </div>
      <CompletenessScoreCard completeness={detail.completeness} />
      <PsiCard title="Unit Snapshot" subtitle="Structured plant profile foundation."><p className="text-sm text-[var(--psm-muted)]">{detail.unit.process_purpose ?? detail.unit.description ?? 'Process purpose is missing.'}</p></PsiCard>
      <MissingPsiItemsTable rows={detail.completeness.missingItems} />
    </div>
  );
}
