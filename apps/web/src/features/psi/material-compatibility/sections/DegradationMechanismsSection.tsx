import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiButton, PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { MaterialCompatibilityLookups } from '../../types/material-compatibility.types';

export function DegradationMechanismsSection({ existing, draft, lookups, busy, onDraftChange, onAdd }: { existing: Array<Record<string, any>>; draft: Record<string, any>; lookups: MaterialCompatibilityLookups; busy?: boolean | undefined; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined }) {
  return (
    <PsiCard title="5. Degradation / Failure Mechanisms" subtitle="Capture corrosion, SCC, embrittlement, HTHA, erosion-corrosion, polymer swelling, seal degradation, coating/lining failure, and other mechanisms.">
      {!existing.length ? <PsiEmptyState title="No degradation mechanisms recorded" message="Add expected, credible, or unknown degradation/failure mechanisms so MI readiness and blockers can be generated." /> : <div className="mb-4 grid gap-3 md:grid-cols-2">{existing.map((item) => <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{item.mechanism_type}</p><p className="text-sm text-[var(--psm-muted)]">{item.risk_level ?? 'Risk not set'} - {item.failure_mode ?? 'Failure mode missing'}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{item.control_basis ?? item.notes ?? 'No basis recorded.'}</p></div>)}</div>}
      <FieldGrid>
        <SelectInput label="Mechanism type" value={draft.mechanism_type} options={lookups.degradationMechanisms} onChange={(mechanism_type) => onDraftChange({ mechanism_type })} />
        <SelectInput label="Risk level" value={draft.risk_level} options={['Low', 'Medium', 'High', 'Critical', 'Unknown']} onChange={(risk_level) => onDraftChange({ risk_level })} />
        <TextInput label="Failure mode" value={draft.failure_mode} onChange={(failure_mode) => onDraftChange({ failure_mode })} />
        <TextInput label="Monitoring method" value={draft.monitoring_method} onChange={(monitoring_method) => onDraftChange({ monitoring_method })} />
        <TextInput label="Inspection interval" value={draft.inspection_interval} onChange={(inspection_interval) => onDraftChange({ inspection_interval })} />
        <Toggle label="MI follow-up required" checked={draft.mi_followup_required} onChange={(mi_followup_required) => onDraftChange({ mi_followup_required })} />
        <TextArea label="Control basis / notes" value={draft.control_basis} onChange={(control_basis) => onDraftChange({ control_basis })} />
      </FieldGrid>
      {onAdd ? <div className="mt-4 flex justify-end"><PsiButton onClick={onAdd} disabled={busy || !draft.mechanism_type} title={busy ? 'Saving degradation mechanism.' : !draft.mechanism_type ? 'Mechanism type is required.' : undefined}>Add Mechanism</PsiButton></div> : null}
    </PsiCard>
  );
}
