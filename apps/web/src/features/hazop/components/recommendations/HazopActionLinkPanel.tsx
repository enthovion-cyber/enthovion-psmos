'use client';

import { Link2, RefreshCw } from 'lucide-react';
import type { HazopRecommendation } from '../../types/hazop-recommendation.types';
import { RecommendationPanel, RecommendationPill } from './HazopRecommendationStatusBadge';

export function HazopActionLinkPanel({ rows, canCreate, canLink, onCreate, onSync }: { rows: HazopRecommendation[]; canCreate?: boolean; canLink?: boolean; onCreate: (row: HazopRecommendation) => void; onSync: (row: HazopRecommendation) => void }) {
  const linked = rows.filter((row) => row.linked_action_id || row.action);
  const unlinked = rows.filter((row) => !(row.linked_action_id || row.action) && !['Verified Closed', 'Cancelled'].includes(row.status));
  return (
    <RecommendationPanel title="Universal Action Link Panel">
      <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm"><div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-2xl font-semibold text-cyan-300">{linked.length}</div><div className="text-xs text-[var(--psm-muted)]">Linked</div></div><div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-2xl font-semibold text-amber-300">{unlinked.length}</div><div className="text-xs text-[var(--psm-muted)]">Need Action</div></div></div>
      <div className="space-y-2">{rows.slice(0, 5).map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><div className="flex items-center justify-between gap-2"><div className="font-semibold">{row.recommendation_number}</div><RecommendationPill tone={row.linked_action_id ? 'green' : 'amber'}>{row.linked_action_id ? 'Linked' : 'Unlinked'}</RecommendationPill></div><div className="mt-2 flex gap-2">{canCreate && !row.linked_action_id ? <button onClick={() => onCreate(row)} className="rounded-lg border border-[var(--psm-line)] px-2 py-1 text-xs"><Link2 size={12} className="mr-1 inline" />Create</button> : null}{canLink && row.linked_action_id ? <button onClick={() => onSync(row)} className="rounded-lg border border-[var(--psm-line)] px-2 py-1 text-xs"><RefreshCw size={12} className="mr-1 inline" />Sync</button> : null}</div></div>)}</div>
    </RecommendationPanel>
  );
}
