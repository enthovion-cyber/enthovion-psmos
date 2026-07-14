'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function AddEditRecommendationDialog({ open, recommendation, context, saving, onClose, onSave }: { open: boolean; recommendation?: any; context: any; saving?: boolean; onClose: () => void; onSave: (values: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    if (open) setForm({
      sourceType: recommendation?.source_type ?? 'Manual',
      nodeId: recommendation?.node_id ?? '',
      scenarioId: recommendation?.scenario_id ?? '',
      safeguardId: recommendation?.safeguard_id ?? '',
      recommendationText: recommendation?.recommendation_text ?? recommendation?.description ?? '',
      rationale: recommendation?.rationale ?? '',
      priority: recommendation?.priority ?? 'Medium',
      ownerId: recommendation?.owner_id ?? '',
      departmentId: recommendation?.department_id ?? '',
      dueDate: recommendation?.due_date ?? '',
      status: recommendation?.status ?? 'Open',
      verificationRequired: Boolean(recommendation?.verification_required),
      evidenceRequired: Boolean(recommendation?.evidence_required),
      closureBlocker: Boolean(recommendation?.closure_blocker),
      lopaRelated: Boolean(recommendation?.lopa_related),
      actionCreationMode: 'none',
      linkedActionId: recommendation?.linked_action_id ?? '',
      notes: recommendation?.notes ?? ''
    });
  }, [open, recommendation]);
  if (!open) return null;
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div><h2 className="text-xl font-semibold">{recommendation ? 'Edit Recommendation' : 'Add Recommendation'}</h2><p className="text-sm text-[var(--psm-muted)]">Recommendations connect to Universal Action Engine and HAZOP closure rules.</p></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] p-2"><X size={18} /></button></div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Source type"><select className="input" value={form.sourceType ?? 'Manual'} onChange={(e) => set('sourceType', e.target.value)}><option>Scenario</option><option>High/Critical Risk</option><option>Safeguard Gap</option><option>IPL Validation Failure</option><option>LOPA Trigger</option><option>Team Decision</option><option>MOC Requirement</option><option>PSSR Blocker</option><option>Manual</option></select></Field>
          <Field label="Status"><select className="input" value={form.status ?? 'Open'} onChange={(e) => set('status', e.target.value)}><option>Draft</option><option>Open</option><option>Assigned</option><option>In Progress</option><option>Pending Evidence</option><option>Pending Verification</option><option>Deferred</option><option>Accepted Risk / No Action</option></select></Field>
          <Field label="Linked node"><select className="input" value={form.nodeId ?? ''} onChange={(e) => set('nodeId', e.target.value)}><option value="">None</option>{(context.nodes ?? []).map((node: any) => <option key={node.id} value={node.id}>{node.node_number} · {node.title}</option>)}</select></Field>
          <Field label="Linked scenario"><select className="input" value={form.scenarioId ?? ''} onChange={(e) => set('scenarioId', e.target.value)}><option value="">None</option>{(context.scenarios ?? []).map((scenario: any) => <option key={scenario.id} value={scenario.id}>{scenario.scenario_number} · {scenario.deviation_text ?? scenario.cause}</option>)}</select></Field>
          <Field label="Linked safeguard"><select className="input" value={form.safeguardId ?? ''} onChange={(e) => set('safeguardId', e.target.value)}><option value="">None</option>{(context.safeguards ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.safeguard_number} · {s.safeguard_name}</option>)}</select></Field>
          <Field label="Priority"><select className="input" value={form.priority ?? 'Medium'} onChange={(e) => set('priority', e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Safety Critical</option></select></Field>
          <Field label="Owner"><select className="input" value={form.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value)}><option value="">Unassigned</option>{(context.users ?? []).map((user: any) => <option key={user.id} value={user.id}>{user.displayName ?? user.email}</option>)}</select></Field>
          <Field label="Department"><select className="input" value={form.departmentId ?? ''} onChange={(e) => set('departmentId', e.target.value)}><option value="">None</option>{(context.departments ?? []).map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></Field>
          <Field label="Due date"><input type="date" className="input" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value)} /></Field>
          <Field label="Action mode"><select className="input" value={form.actionCreationMode ?? 'none'} onChange={(e) => set('actionCreationMode', e.target.value)}><option value="none">Save recommendation only</option><option value="create">Save and create Universal Action</option><option value="link">Link existing action</option></select></Field>
          {form.actionCreationMode === 'link' ? <Field label="Existing action ID"><input className="input" value={form.linkedActionId ?? ''} onChange={(e) => set('linkedActionId', e.target.value)} /></Field> : null}
          <Field label="Recommendation text" wide required><textarea className="input min-h-28" value={form.recommendationText ?? ''} onChange={(e) => set('recommendationText', e.target.value)} /></Field>
          <Field label="Rationale / reason" wide><textarea className="input min-h-20" value={form.rationale ?? ''} onChange={(e) => set('rationale', e.target.value)} /></Field>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-4">{['verificationRequired', 'evidenceRequired', 'closureBlocker', 'lopaRelated'].map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} />{labelize(key)}</label>)}</div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={saving || !form.recommendationText} onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : recommendation ? 'Save Changes' : 'Save Recommendation'}</button></div>
      </div>
    </div>
  );
}

function Field({ label, wide, required, children }: { label: string; wide?: boolean; required?: boolean; children: any }) {
  return <label className={wide ? 'md:col-span-2' : ''}><span className="mb-1 block text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span>{children}</label>;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
