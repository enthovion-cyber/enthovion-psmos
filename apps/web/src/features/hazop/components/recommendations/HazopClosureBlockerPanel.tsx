'use client';

import type { HazopRecommendation } from '../../types/hazop-recommendation.types';
import { RecommendationPanel, RecommendationPill } from './HazopRecommendationStatusBadge';

export function HazopClosureBlockerPanel({ rows, onOpen }: { rows: HazopRecommendation[]; onOpen: (row: HazopRecommendation) => void }) {
  return <RecommendationPanel title="Closure Blockers"><div className="space-y-2">{rows.slice(0, 6).map((row) => <button key={row.id} onClick={() => onOpen(row)} className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-left"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{row.recommendation_number}</div><div className="line-clamp-2 text-xs text-[var(--psm-muted)]">{row.recommendation_text ?? row.description}</div></div><RecommendationPill tone="red">Blocking</RecommendationPill></div></button>)}{!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">No active closure blockers.</div> : null}</div></RecommendationPanel>;
}
