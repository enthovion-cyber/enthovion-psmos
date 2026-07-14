'use client';

import { AlertTriangle } from 'lucide-react';
import type { HazopRecommendation } from '../../types/hazop-recommendation.types';
import { RecommendationPanel, RecommendationPill } from './HazopRecommendationStatusBadge';

export function HazopOverdueEscalationPanel({ rows, onOpen }: { rows: HazopRecommendation[]; onOpen: (row: HazopRecommendation) => void }) {
  return <RecommendationPanel title="Overdue / Escalation"><div className="space-y-2">{rows.slice(0, 6).map((row) => <button key={row.id} onClick={() => onOpen(row)} className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-left"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{row.recommendation_number}</div><div className="text-xs text-[var(--psm-muted)]">Owner: {row.owner?.displayName ?? row.owner_id ?? '-'} · Due {row.due_date ?? '-'}</div></div><RecommendationPill tone="red">Escalate</RecommendationPill></div></button>)}{!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]"><AlertTriangle size={18} className="mx-auto mb-2" />No overdue recommendations.</div> : null}</div></RecommendationPanel>;
}
