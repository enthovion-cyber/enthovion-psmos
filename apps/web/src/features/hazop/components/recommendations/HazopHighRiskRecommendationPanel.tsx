'use client';

import type { HazopRecommendation } from '../../types/hazop-recommendation.types';
import { HazopRecommendationPriorityBadge } from './HazopRecommendationPriorityBadge';
import { RecommendationPanel } from './HazopRecommendationStatusBadge';

export function HazopHighRiskRecommendationPanel({ rows, onOpen }: { rows: HazopRecommendation[]; onOpen: (row: HazopRecommendation) => void }) {
  const high = rows.filter((row) => ['High', 'Critical', 'Safety Critical'].includes(row.priority) || ['High', 'Critical'].includes(row.scenario?.risk_level));
  return <RecommendationPanel title="Open Critical / High-Risk"><div className="space-y-2">{high.slice(0, 6).map((row) => <button key={row.id} onClick={() => onOpen(row)} className="w-full rounded-lg border border-[var(--psm-line)] p-3 text-left hover:bg-[var(--psm-surface-2)]"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{row.recommendation_number}</div><div className="line-clamp-2 text-xs text-[var(--psm-muted)]">{row.recommendation_text ?? row.description}</div></div><HazopRecommendationPriorityBadge value={row.priority} /></div></button>)}{!high.length ? <Empty text="No open high-risk recommendations." /> : null}</div></RecommendationPanel>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
