"use client";
import { useState } from "react";
import { AuditButton, Field, inputClass } from "../shared/AuditUi";

export function AuditScoringModelForm({ initial = {}, onSubmit }: { initial?: Record<string, any>; onSubmit: (payload: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState<Record<string, any>>({ modelTitle: initial.model_title ?? "", modelType: initial.model_type ?? "Weighted Compliance", methodologyVersion: initial.methodology_version ?? "1.0", modelStatus: initial.model_status ?? "Draft", description: initial.description ?? "", defaultModel: initial.default_model ?? false });
  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const disabled = !form.modelTitle ? "Model title is required." : undefined;
  return <form className="grid gap-4 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (!disabled) await onSubmit(form); }}>
    <Field label="Model title"><input className={inputClass()} value={form.modelTitle} onChange={(e) => set("modelTitle", e.target.value)} /></Field>
    <Field label="Model type"><select className={inputClass()} value={form.modelType} onChange={(e) => set("modelType", e.target.value)}>{["Weighted Compliance","Pass/Fail Critical Control","Evidence Verified Compliance","Finding Deduction","CAPA Recovery","Hybrid PSM Assurance","Regulatory Clause Score","Custom"].map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Methodology version"><input className={inputClass()} value={form.methodologyVersion} onChange={(e) => set("methodologyVersion", e.target.value)} /></Field>
    <Field label="Status"><select className={inputClass()} value={form.modelStatus} onChange={(e) => set("modelStatus", e.target.value)}>{["Draft","Active","Pending Review","Approved","Archived","Superseded"].map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Description"><textarea className={inputClass()} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(form.defaultModel)} onChange={(e) => set("defaultModel", e.target.checked)} /> Default model</label>
    <div className="md:col-span-2"><AuditButton type="submit" disabled={Boolean(disabled)} title={disabled}>Save Model</AuditButton></div>
  </form>;
}
