import { PsiMetricCard } from '../../shared/PsiUi';
import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardBarrierMap } from '../SafeguardBarrierMap';
import { SafeguardCompletenessPanel } from '../SafeguardCompletenessPanel';
import { SafeguardConflictPanel } from '../SafeguardConflictPanel';
import { SafeguardSourceStatusPanel } from '../SafeguardSourceStatusPanel';

export function SafeguardOverviewTab({ detail }: { detail: SafeguardDetail }) {
  return <div className="space-y-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={String(card.value ?? 'N/A')} tone={card.tone ?? 'neutral'} />)}</div><SafeguardBarrierMap hazardLinks={detail.hazardLinks} sourceLinks={detail.sourceLinks} /><SafeguardSourceStatusPanel sourceLinks={detail.sourceLinks} syncEvents={detail.syncEvents} /><SafeguardCompletenessPanel checks={detail.completeness} score={detail.safeguard.completeness_score} /><SafeguardConflictPanel conflicts={detail.conflicts} /></div>;
}
