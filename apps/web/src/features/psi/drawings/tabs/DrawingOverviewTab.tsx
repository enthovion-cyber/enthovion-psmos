import { PsiMetricCard, PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingOverviewTab({ detail }: { detail: DrawingDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">{detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={String(card.value ?? '-')} tone={card.tone ?? 'neutral'} />)}</div>
      <PsiCard title="Open Blockers / PSI Completeness Impact" subtitle="Backend-generated blockers from completeness and conflict validation.">
        {!detail.overview.blockers.length ? <p className="text-sm text-[var(--psm-muted)]">No open drawing blockers.</p> : <div className="space-y-2">{detail.overview.blockers.map((blocker, index) => <div key={index} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">{String(blocker.check_title ?? blocker.conflict_type ?? 'Blocker')}<p className="text-xs text-[var(--psm-muted)]">{String(blocker.message ?? '')}</p></div>)}</div>}
      </PsiCard>
    </div>
  );
}
