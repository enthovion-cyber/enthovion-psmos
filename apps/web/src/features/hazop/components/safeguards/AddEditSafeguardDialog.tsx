'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const safeguardTypes = ['BPCS', 'Alarm with operator response', 'PSV / relief valve', 'Rupture disc', 'Mechanical protection', 'Interlock', 'SIS / SIF', 'ESD', 'Fire and gas system', 'Physical containment', 'Check valve', 'Flame arrestor', 'Ventilation', 'Operating procedure', 'Maintenance/inspection program', 'Training/competency', 'Emergency response', 'Administrative control', 'PTW control', 'LOTO / isolation control', 'Other'];

export function AddEditSafeguardDialog({ open, safeguard, scenarios, saving, onClose, onSave }: { open: boolean; safeguard?: any; scenarios: any[]; saving?: boolean; onClose: () => void; onSave: (scenarioId: string, values: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    if (open) setForm({
      scenarioId: safeguard?.scenario_id ?? scenarios[0]?.id ?? '',
      safeguardName: safeguard?.safeguard_name ?? '',
      safeguardType: safeguard?.safeguard_type ?? 'BPCS',
      safeguardCategory: safeguard?.safeguard_category ?? 'Preventive',
      description: safeguard?.description ?? '',
      creditedForRiskReduction: Boolean(safeguard?.credited_for_risk_reduction),
      iplCandidate: Boolean(safeguard?.ipl_candidate),
      proofTestRequired: Boolean(safeguard?.testStatus?.proof_test_required),
      inspectionRequired: Boolean(safeguard?.testStatus?.inspection_required),
      evidenceRequired: Boolean(safeguard?.evidence_required),
      proofTestInterval: safeguard?.proof_test_interval ?? '',
      equipmentId: safeguard?.equipment_id ?? '',
      documentId: safeguard?.document_id ?? '',
      ownerId: safeguard?.owner_id ?? '',
      notes: safeguard?.notes ?? ''
    });
  }, [open, safeguard, scenarios]);
  if (!open) return null;
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <div><h2 className="text-xl font-semibold">{safeguard ? 'Edit Safeguard' : 'Add Safeguard'}</h2><p className="text-sm text-[var(--psm-muted)]">Safeguards are linked to scenarios and audited in HAZOP history.</p></div>
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] p-2"><X size={18} /></button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Scenario"><select className="input" value={form.scenarioId ?? ''} onChange={(e) => set('scenarioId', e.target.value)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.scenario_number} · {scenario.deviation_text ?? scenario.cause}</option>)}</select></Field>
          <Field label="Safeguard type"><select className="input" value={form.safeguardType ?? 'BPCS'} onChange={(e) => set('safeguardType', e.target.value)}>{safeguardTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
          <Field label="Safeguard name" required><input className="input" value={form.safeguardName ?? ''} onChange={(e) => set('safeguardName', e.target.value)} /></Field>
          <Field label="Category"><select className="input" value={form.safeguardCategory ?? 'Preventive'} onChange={(e) => set('safeguardCategory', e.target.value)}><option>Preventive</option><option>Mitigative</option><option>Detection</option><option>Administrative</option><option>Emergency Response</option></select></Field>
          <Field label="Equipment ID"><input className="input" value={form.equipmentId ?? ''} onChange={(e) => set('equipmentId', e.target.value)} placeholder="Equipment record ID" /></Field>
          <Field label="Document / P&ID ID"><input className="input" value={form.documentId ?? ''} onChange={(e) => set('documentId', e.target.value)} placeholder="Document record ID" /></Field>
          <Field label="Owner user ID"><input className="input" value={form.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value)} /></Field>
          <Field label="Proof test interval"><input className="input" value={form.proofTestInterval ?? ''} onChange={(e) => set('proofTestInterval', e.target.value)} placeholder="12 months" /></Field>
          <Field label="Description" wide><textarea className="input min-h-28" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Notes" wide><textarea className="input min-h-20" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
          <div className="md:col-span-2 grid gap-3 md:grid-cols-4">
            {['creditedForRiskReduction', 'iplCandidate', 'proofTestRequired', 'inspectionRequired', 'evidenceRequired'].map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} />{labelize(key)}</label>)}
          </div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button disabled={saving || !form.scenarioId || !form.safeguardName} onClick={() => onSave(form.scenarioId, form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Safeguard'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: any }) {
  return <label className={wide ? 'md:col-span-2' : ''}><span className="mb-1 block text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span>{children}</label>;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
