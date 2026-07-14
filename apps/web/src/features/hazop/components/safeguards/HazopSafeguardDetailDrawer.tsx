'use client';

import { X } from 'lucide-react';
import type { HazopSafeguard } from '../../types/hazop-safeguard.types';
import { HazopIplStatusBadge, SafeguardPill } from './HazopIplStatusBadge';
import { HazopSafeguardTypeBadge } from './HazopSafeguardTypeBadge';

export function HazopSafeguardDetailDrawer({ safeguard, onClose, onEdit, onValidate, onMarkIpl, onMarkCredited, readonly, canEdit }: { safeguard: HazopSafeguard; onClose: () => void; onEdit: () => void; onValidate: () => void; onMarkIpl: () => void; onMarkCredited: () => void; readonly?: boolean; canEdit?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--psm-muted)]">Safeguard detail</div>
            <h2 className="text-2xl font-semibold">{safeguard.safeguard_number}</h2>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{safeguard.safeguard_name}</p>
            <div className="mt-3 flex flex-wrap gap-2"><HazopSafeguardTypeBadge value={safeguard.safeguard_type} /><HazopIplStatusBadge value={safeguard.ipl_validation_status} />{safeguard.ipl_candidate ? <SafeguardPill tone="amber">IPL Candidate</SafeguardPill> : null}{safeguard.credited_for_risk_reduction ? <SafeguardPill tone="green">Credited</SafeguardPill> : null}</div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] p-2"><X size={18} /></button>
        </div>

        <Grid>
          <Metric label="Scenario" value={safeguard.scenario?.scenario_number ?? safeguard.scenario_id} />
          <Metric label="Node" value={safeguard.node?.node_number ?? '-'} />
          <Metric label="Proof test" value={safeguard.testStatus?.status ?? safeguard.proof_test_status ?? '-'} />
        </Grid>
        <Block title="Description" text={safeguard.description} />
        <Block title="Scenario Cause" text={safeguard.scenario?.cause ?? 'Not available'} />
        <Block title="Scenario Consequence" text={safeguard.scenario?.consequence ?? 'Not available'} />
        <Block title="Equipment / Document" text={[safeguard.equipment?.tag ?? safeguard.equipment_id, safeguard.document?.document_number ?? safeguard.document_id].filter(Boolean).join(' / ') || 'No links captured'} />

        <div className="mt-5 flex flex-wrap gap-2">
          {canEdit && !readonly ? <button onClick={onEdit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Edit Safeguard</button> : null}
          {canEdit && !readonly ? <button onClick={onValidate} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Validate IPL</button> : null}
          {canEdit && !readonly && !safeguard.ipl_candidate ? <button onClick={onMarkIpl} className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-300">Mark IPL Candidate</button> : null}
          {canEdit && !readonly && !safeguard.credited_for_risk_reduction ? <button onClick={onMarkCredited} className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-300">Credit Safeguard</button> : null}
        </div>
      </aside>
    </div>
  );
}

function Grid({ children }: { children: any }) {
  return <div className="grid gap-3 md:grid-cols-3">{children}</div>;
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-[var(--psm-line)] p-3"><div className="text-xs uppercase text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

function Block({ title, text }: { title: string; text: string }) {
  return <section className="mt-4 rounded-xl border border-[var(--psm-line)] p-4"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-[var(--psm-muted)]">{text}</p></section>;
}
