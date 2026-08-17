"use client";
import { useState } from "react";
import { AuditButton, Field, inputClass } from "../shared/AuditUi";
import { auditScoringService } from "../services/audit-scoring.service";

export function AuditScoringRuleBuilder({ modelId, onSaved }: { modelId: string; onSaved?: () => void }) {
  const [form, setForm] = useState({ ruleTitle: "", ruleType: "Checklist Response", ruleCategory: "Scoring", appliesTo: "Audit Score Run", penalty: "", capScore: "" });
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const disabled = !form.ruleTitle ? "Rule title is required." : undefined;
  return <form className="grid gap-3 md:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); if (!disabled) { await auditScoringService.saveRule(modelId, form); onSaved?.(); setForm({ ...form, ruleTitle: "", penalty: "", capScore: "" }); } }}>
    <Field label="Rule title"><input className={inputClass()} value={form.ruleTitle} onChange={(e) => set("ruleTitle", e.target.value)} /></Field>
    <Field label="Rule type"><select className={inputClass()} value={form.ruleType} onChange={(e) => set("ruleType", e.target.value)}>{["Checklist Response","Evidence Verification","Finding Severity Impact","CAPA Closure Impact","Manual Bonus/Penalty","Critical Cap","Fail Condition","Aggregation","Staleness","Custom"].map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Applies to"><input className={inputClass()} value={form.appliesTo} onChange={(e) => set("appliesTo", e.target.value)} /></Field>
    <Field label="Penalty"><input className={inputClass()} value={form.penalty} onChange={(e) => set("penalty", e.target.value)} type="number" /></Field>
    <Field label="Cap score"><input className={inputClass()} value={form.capScore} onChange={(e) => set("capScore", e.target.value)} type="number" /></Field>
    <div className="flex items-end"><AuditButton type="submit" disabled={Boolean(disabled)} title={disabled}>Add Rule</AuditButton></div>
  </form>;
}
