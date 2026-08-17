"use client";
import { useState } from "react";
import { AuditButton, Field, inputClass } from "../shared/AuditUi";
import type { AuditCapaContext } from "../types/audit-capa.types";
import { validateAuditCapaAction } from "../schemas/audit-capa-action.schema";

export function AuditCapaActionForm({ context, defaultType = "Corrective Action", onSubmit }: { context?: AuditCapaContext | undefined; defaultType?: string | undefined; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ actionType: defaultType, priority: "Medium", evidenceRequired: true, verificationRequired: true });
  const set = (patch: Record<string, any>) => setForm((current) => ({ ...current, ...patch }));
  const errors = validateAuditCapaAction(form);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Action title"><input className={inputClass()} value={form.actionTitle ?? ""} onChange={(e) => set({ actionTitle: e.target.value })} /></Field>
      <Field label="Action type"><select className={inputClass()} value={form.actionType} onChange={(e) => set({ actionType: e.target.value })}>{(context?.lookups.capaActionTypes ?? [defaultType]).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Owner"><select className={inputClass()} value={form.ownerUserId ?? ""} onChange={(e) => set({ ownerUserId: e.target.value })}><option value="">Select owner</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="Due date"><input type="date" className={inputClass()} value={form.dueDate ?? ""} onChange={(e) => set({ dueDate: e.target.value })} /></Field>
      <Field label="Priority"><select className={inputClass()} value={form.priority} onChange={(e) => set({ priority: e.target.value })}>{(context?.lookups.priorities ?? ["Medium"]).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Linked module"><select className={inputClass()} value={form.linkedModule ?? ""} onChange={(e) => set({ linkedModule: e.target.value })}><option value="">None</option>{(context?.lookups.auditableModules ?? []).map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></Field>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">Description / criteria</span><textarea className={inputClass()} rows={3} value={form.actionDescription ?? ""} onChange={(e) => set({ actionDescription: e.target.value })} /></label>
      <div className="flex flex-wrap gap-4 text-sm text-[var(--psm-fg)] md:col-span-2">
        <label><input type="checkbox" checked={Boolean(form.evidenceRequired)} onChange={(e) => set({ evidenceRequired: e.target.checked })} /> Evidence required</label>
        <label><input type="checkbox" checked={Boolean(form.verificationRequired)} onChange={(e) => set({ verificationRequired: e.target.checked })} /> Verification required</label>
        <label><input type="checkbox" checked={Boolean(form.effectivenessRequired)} onChange={(e) => set({ effectivenessRequired: e.target.checked })} /> Effectiveness required</label>
      </div>
      {errors.length ? <p className="text-sm text-danger md:col-span-2">{errors.join(" ")}</p> : null}
      <div className="md:col-span-2"><AuditButton disabled={Boolean(errors.length)} title={errors[0] ?? "Create CAPA action"} onClick={() => onSubmit(form)}>Create Action</AuditButton></div>
    </div>
  );
}
