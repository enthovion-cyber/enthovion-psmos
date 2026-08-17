"use client";
import { useState } from "react";
import { AuditButton, Field, inputClass } from "../shared/AuditUi";
import type { AuditScoringContext } from "../types/audit-scoring.types";

export function AuditScoreRunForm({ context, sourceType, sourceId, onSubmit }: { context: AuditScoringContext; sourceType?: string | undefined; sourceId?: string | undefined; onSubmit: (payload: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState<Record<string, any>>({ sourceObjectType: sourceType ?? "execution", sourceObjectId: sourceId ?? "", modelId: context.models[0]?.id ?? "", siteId: context.sites[0]?.id ?? "" });
  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const options = form.sourceObjectType === "program" ? context.programs : form.sourceObjectType === "plan" ? context.plans : form.sourceObjectType === "execution" ? context.executions : form.sourceObjectType === "site" ? context.sites : form.sourceObjectType === "unit" ? context.units : form.sourceObjectType === "area" ? context.areas : [];
  const disabled = !form.sourceObjectId ? "Select a source record before running score." : !form.modelId && !context.models.length ? "A scoring model is required; backend can create a default model if policy allows, but no model is visible in your scope." : undefined;
  return <form className="grid gap-4 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (!disabled) await onSubmit(form); }}>
    <Field label="Source type"><select className={inputClass()} value={form.sourceObjectType} onChange={(e) => set("sourceObjectType", e.target.value)} disabled={Boolean(sourceType)}>{["execution","plan","program","site","unit","area"].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
    <Field label="Source record"><select className={inputClass()} value={form.sourceObjectId} onChange={(e) => set("sourceObjectId", e.target.value)} disabled={Boolean(sourceId)}><option value="">Select source</option>{options.map((row: any) => <option key={row.id} value={row.id}>{row.execution_title ?? row.plan_title ?? row.program_title ?? row.name ?? row.id}</option>)}</select></Field>
    <Field label="Scoring model"><select className={inputClass()} value={form.modelId} onChange={(e) => set("modelId", e.target.value)}><option value="">Use backend default</option>{context.models.map((row: any) => <option key={row.id} value={row.id}>{row.model_title ?? row.model_code}</option>)}</select></Field>
    <Field label="Site"><select className={inputClass()} value={form.siteId} onChange={(e) => set("siteId", e.target.value)}><option value="">Company scope</option>{context.sites.map((row: any) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
    <div className="md:col-span-2"><AuditButton type="submit" disabled={Boolean(disabled)} title={disabled}>Run Score</AuditButton></div>
  </form>;
}
