import { PsiMetricCard } from '../../shared/PsiUi';
import type { SafeOperatingLimitDetail } from '../../types/safe-operating-limit.types';
import { LimitCompletenessPanel } from '../LimitCompletenessPanel';
import { LimitConflictPanel } from '../LimitConflictPanel';
import { LimitRangeVisualizer } from '../LimitRangeVisualizer';

export function LimitOverviewTab({ detail }: { detail: SafeOperatingLimitDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={String(card.value ?? '-')} tone={card.tone ?? 'neutral'} />)}</div>
      <div className="grid gap-5 xl:grid-cols-2"><LimitRangeVisualizer values={detail.values} unit={detail.limit.unit_of_measure} /><LimitConflictPanel rows={detail.conflicts} /></div>
      <LimitCompletenessPanel rows={detail.completeness} />
    </div>
  );
}
