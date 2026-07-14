'use client';

import { Edit3, Eye, Link2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { HazopRecommendation } from '../../types/hazop-recommendation.types';
import { HazopRecommendationPriorityBadge } from './HazopRecommendationPriorityBadge';
import { HazopRecommendationStatusBadge, RecommendationPill } from './HazopRecommendationStatusBadge';

export function HazopRecommendationRegister({ rows, loading, readonly, canEdit, canDelete, onOpen, onEdit, onDelete, onAction, onEvidence, onVerify }: { rows: HazopRecommendation[]; loading?: boolean; readonly?: boolean; canEdit?: boolean; canDelete?: boolean; onOpen: (row: HazopRecommendation) => void; onEdit: (row: HazopRecommendation) => void; onDelete: (row: HazopRecommendation) => void; onAction: (row: HazopRecommendation) => void; onEvidence: (row: HazopRecommendation) => void; onVerify: (row: HazopRecommendation) => void }) {
  if (loading) return <div className="rounded-xl border border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">Loading recommendation register...</div>;
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4"><h3 className="font-semibold">Recommendation Register</h3><span className="text-xs text-[var(--psm-muted)]">{rows.length} recommendations</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1450px] text-sm">
          <thead className="sticky top-0 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Recommendation', 'Source', 'Node', 'Scenario / Deviation', 'Risk', 'Priority', 'Owner', 'Due', 'Status', 'Evidence', 'Action', 'Blocker', 'Updated', 'Actions'].map((head) => <th key={head} className="px-3 py-3 text-left">{head}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)] ${row.closureBlockerActive ? 'bg-red-500/[0.03]' : ''}`}>
                <td className="px-3 py-3"><button onClick={() => onOpen(row)} className="font-semibold text-primary">{row.recommendation_number}</button><div className="line-clamp-2 max-w-md text-xs text-[var(--psm-muted)]">{row.recommendation_text ?? row.description}</div></td>
                <td className="px-3 py-3">{row.source_type}</td>
                <td className="px-3 py-3">{row.node?.node_number ?? '-'}</td>
                <td className="px-3 py-3">{row.scenario?.scenario_number ?? '-'}<div className="line-clamp-1 text-xs text-[var(--psm-muted)]">{row.scenario?.deviation_text ?? row.scenario?.cause ?? ''}</div></td>
                <td className="px-3 py-3">{row.scenario?.risk_level ? <RecommendationPill tone={['High', 'Critical'].includes(row.scenario.risk_level) ? 'red' : 'amber'}>{row.scenario.risk_level}</RecommendationPill> : '-'}</td>
                <td className="px-3 py-3"><HazopRecommendationPriorityBadge value={row.priority} /></td>
                <td className="px-3 py-3">{row.owner?.displayName ?? row.owner_id ?? '-'}</td>
                <td className={`px-3 py-3 ${row.overdue ? 'text-red-300' : ''}`}>{row.due_date ?? '-'}</td>
                <td className="px-3 py-3"><HazopRecommendationStatusBadge value={row.status} /></td>
                <td className="px-3 py-3">{row.evidence_status ?? '-'}</td>
                <td className="px-3 py-3">{row.action?.actionNumber ?? row.linked_action_id ?? '-'}<div className="text-xs text-[var(--psm-muted)]">{row.action_status_snapshot ?? row.action?.status ?? ''}</div></td>
                <td className="px-3 py-3">{row.closureBlockerActive ? <RecommendationPill tone="red">Blocking</RecommendationPill> : row.closure_blocker ? <RecommendationPill tone="amber">Configured</RecommendationPill> : '-'}</td>
                <td className="px-3 py-3">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '-'}</td>
                <td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => onOpen(row)} className="rounded-lg border border-[var(--psm-line)] p-2"><Eye size={15} /></button>{canEdit && !readonly ? <button onClick={() => onEdit(row)} className="rounded-lg border border-[var(--psm-line)] p-2"><Edit3 size={15} /></button> : null}{canEdit && !readonly ? <button onClick={() => onAction(row)} className="rounded-lg border border-[var(--psm-line)] p-2"><Link2 size={15} /></button> : null}{canEdit && !readonly ? <button onClick={() => onEvidence(row)} className="rounded-lg border border-[var(--psm-line)] p-2"><Upload size={15} /></button> : null}{canEdit && !readonly ? <button onClick={() => onVerify(row)} className="rounded-lg border border-[var(--psm-line)] p-2"><ShieldCheck size={15} /></button> : null}{canDelete && !readonly ? <button onClick={() => onDelete(row)} className="rounded-lg border border-red-500/30 p-2 text-red-300"><Trash2 size={15} /></button> : null}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="p-8 text-center text-sm text-[var(--psm-muted)]">No recommendations match the current filters.</div> : null}
    </section>
  );
}
