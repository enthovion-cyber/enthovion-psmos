'use client';

import { X } from 'lucide-react';
import type { HazopRecommendation } from '../../types/hazop-recommendation.types';
import { HazopRecommendationEvidencePanel } from './HazopRecommendationEvidencePanel';
import { HazopRecommendationPriorityBadge } from './HazopRecommendationPriorityBadge';
import { HazopRecommendationStatusBadge, RecommendationPanel, RecommendationPill } from './HazopRecommendationStatusBadge';
import { HazopRecommendationVerificationPanel } from './HazopRecommendationVerificationPanel';

export function HazopRecommendationDetailDrawer({ recommendation, canEdit, canEvidence, canVerify, readonly, onClose, onEdit, onCreateAction, onSyncAction, onUploadEvidence, onRequestVerification, onVerify, onReject, onCancel, onDefer }: { recommendation: HazopRecommendation; canEdit?: boolean; canEvidence?: boolean; canVerify?: boolean; readonly?: boolean; onClose: () => void; onEdit: () => void; onCreateAction: () => void; onSyncAction: () => void; onUploadEvidence: (values: Record<string, any>) => void; onRequestVerification: () => void; onVerify: (values: Record<string, any>) => void; onReject: (values: Record<string, any>) => void; onCancel: () => void; onDefer: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <aside className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4"><div><div className="text-sm text-[var(--psm-muted)]">Recommendation detail</div><h2 className="text-2xl font-semibold">{recommendation.recommendation_number}</h2><p className="mt-1 text-sm text-[var(--psm-muted)]">{recommendation.recommendation_text ?? recommendation.description}</p><div className="mt-3 flex flex-wrap gap-2"><HazopRecommendationPriorityBadge value={recommendation.priority} /><HazopRecommendationStatusBadge value={recommendation.status} />{recommendation.closureBlockerActive ? <RecommendationPill tone="red">Closure Blocker</RecommendationPill> : null}</div></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] p-2"><X size={18} /></button></div>
        <div className="grid gap-3 md:grid-cols-3"><Metric label="Source" value={recommendation.source_type} /><Metric label="Owner" value={recommendation.owner?.displayName ?? recommendation.owner_id ?? '-'} /><Metric label="Due" value={recommendation.due_date ?? '-'} /></div>
        <Block title="Rationale" text={recommendation.rationale ?? 'No rationale captured.'} />
        <Block title="Source Scenario / Risk" text={[recommendation.node?.node_number, recommendation.scenario?.scenario_number, recommendation.scenario?.deviation_text, recommendation.scenario?.risk_level].filter(Boolean).join(' / ') || 'Manual recommendation'} />
        <Block title="Linked Safeguard / IPL" text={[recommendation.safeguard?.safeguard_number, recommendation.safeguard?.safeguard_name].filter(Boolean).join(' / ') || 'No safeguard linked'} />
        <RecommendationPanel title="Linked Universal Action"><div className="text-sm text-[var(--psm-muted)]">{recommendation.action?.actionNumber ?? recommendation.linked_action_id ?? 'No action linked'} · {recommendation.action_status_snapshot ?? recommendation.action?.status ?? ''}</div>{canEdit && !readonly ? <div className="mt-3 flex gap-2"><button onClick={onCreateAction} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Create/Link Action</button>{recommendation.linked_action_id ? <button onClick={onSyncAction} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Sync Action</button> : null}</div> : null}</RecommendationPanel>
        <div className="mt-4 grid gap-4 xl:grid-cols-2"><HazopRecommendationEvidencePanel recommendation={recommendation} canUpload={canEvidence && !readonly} onUpload={onUploadEvidence} /><HazopRecommendationVerificationPanel recommendation={recommendation} canVerify={canVerify && !readonly} onRequest={onRequestVerification} onVerify={onVerify} onReject={onReject} /></div>
        <div className="mt-5 flex flex-wrap gap-2">{canEdit && !readonly ? <button onClick={onEdit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Edit</button> : null}{canEdit && !readonly ? <button onClick={onDefer} className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-300">Defer</button> : null}{canEdit && !readonly ? <button onClick={onCancel} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300">Cancel</button> : null}</div>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-[var(--psm-line)] p-3"><div className="text-xs uppercase text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

function Block({ title, text }: { title: string; text: string }) {
  return <section className="mt-4 rounded-xl border border-[var(--psm-line)] p-4"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-[var(--psm-muted)]">{text}</p></section>;
}
