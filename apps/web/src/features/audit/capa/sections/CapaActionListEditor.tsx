import { AuditButton, Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaActionListEditor({ title, description, actionType, rows, onChange, context }: { title: string; description: string; actionType: string; rows: Record<string, any>[]; onChange: (rows: Record<string, any>[]) => void; context?: AuditCapaContext | undefined }) {
  const update = (index: number, patch: Record<string, any>) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const add = () => onChange([...rows, { actionType, priority: "Medium", evidenceRequired: true, verificationRequired: true, effectivenessRequired: actionType !== "Corrective Action" }]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-[var(--psm-fg)]">{title}</h3><p className="text-sm text-[var(--psm-muted)]">{description}</p></div><AuditButton onClick={add} variant="secondary">Add Action</AuditButton></div>
      {rows.length ? rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Action title"><input className={inputClass()} value={row.actionTitle ?? ""} onChange={(e) => update(index, { actionTitle: e.target.value })} /></Field>
            <Field label="Action type"><select className={inputClass()} value={row.actionType ?? actionType} onChange={(e) => update(index, { actionType: e.target.value })}>{(context?.lookups.capaActionTypes ?? [actionType]).map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Action owner"><select className={inputClass()} value={row.ownerUserId ?? ""} onChange={(e) => update(index, { ownerUserId: e.target.value })}><option value="">Select owner</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
            <Field label="Due date"><input type="date" className={inputClass()} value={row.dueDate ?? ""} onChange={(e) => update(index, { dueDate: e.target.value })} /></Field>
            <Field label="Priority"><select className={inputClass()} value={row.priority ?? "Medium"} onChange={(e) => update(index, { priority: e.target.value })}>{(context?.lookups.priorities ?? ["Medium"]).map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Linked module"><select className={inputClass()} value={row.linkedModule ?? ""} onChange={(e) => update(index, { linkedModule: e.target.value })}><option value="">None</option>{(context?.lookups.auditableModules ?? []).map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></Field>
          </div>
          <label className="mt-3 block space-y-1 text-sm"><span className="font-semibold text-[var(--psm-fg)]">Description / completion criteria</span><textarea className={inputClass()} rows={3} value={row.actionDescription ?? ""} onChange={(e) => update(index, { actionDescription: e.target.value })} /></label>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--psm-fg)]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(row.evidenceRequired)} onChange={(e) => update(index, { evidenceRequired: e.target.checked })} /> Evidence required</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(row.verificationRequired)} onChange={(e) => update(index, { verificationRequired: e.target.checked })} /> Verification required</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(row.effectivenessRequired)} onChange={(e) => update(index, { effectivenessRequired: e.target.checked })} /> Effectiveness required</label>
            <AuditButton variant="danger" onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove</AuditButton>
          </div>
        </div>
      )) : <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No actions added yet. Backend requires at least one action before opening CAPA.</div>}
    </div>
  );
}
