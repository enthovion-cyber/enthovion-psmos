"use client";
import { useState } from "react";
import { AuditButton, AuditCard, Field, inputClass } from "../shared/AuditUi";
import { useAuditReportTemplate, useAuditReportTemplateMutations } from "../hooks/useAuditReportTemplates";
export function AuditReportTemplateForm({ templateId }: { templateId?: string | undefined }) {
  const existing = useAuditReportTemplate(templateId);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const value = { ...(existing.data ?? {}), ...draft };
  const mutations = useAuditReportTemplateMutations(templateId);
  const set = (key: string, next: unknown) => setDraft((prev) => ({ ...prev, [key]: next }));
  return <AuditCard title="Report Template Builder" subtitle="Template records are stored in backend tables and can be approved/versioned.">
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Template name"><input className={inputClass()} value={String(value.templateName ?? value.template_name ?? "")} onChange={(e) => set("templateName", e.target.value)} /></Field>
      <Field label="Template type"><input className={inputClass()} value={String(value.templateType ?? value.template_type ?? "Audit Report")} onChange={(e) => set("templateType", e.target.value)} /></Field>
      <Field label="Default format"><select className={inputClass()} value={String(value.defaultFormat ?? value.default_format ?? "PDF")} onChange={(e) => set("defaultFormat", e.target.value)}>{["PDF","DOCX","XLSX","CSV","JSON","ZIP"].map((v) => <option key={v}>{v}</option>)}</select></Field>
      <Field label="Intended audience"><input className={inputClass()} value={String(value.intendedAudience ?? value.intended_audience ?? "Internal")} onChange={(e) => set("intendedAudience", e.target.value)} /></Field>
      <Field label="Section schema JSON"><textarea className={inputClass()} value={typeof value.sectionSchema === "string" ? value.sectionSchema : JSON.stringify(value.section_schema_json ?? {}, null, 2)} onChange={(e) => set("sectionSchema", safeJson(e.target.value))} /></Field>
      <Field label="Redaction rules JSON"><textarea className={inputClass()} value={typeof value.redactionRules === "string" ? value.redactionRules : JSON.stringify(value.redaction_rules_json ?? {}, null, 2)} onChange={(e) => set("redactionRules", safeJson(e.target.value))} /></Field>
    </div>
    <div className="mt-4 flex flex-wrap gap-2"><AuditButton onClick={() => mutations.save.mutate(draft)} disabled={mutations.save.isPending || !String(value.templateName ?? value.template_name ?? "").trim()} title={!String(value.templateName ?? value.template_name ?? "").trim() ? "Template name is required." : "Save template"}>{mutations.save.isPending ? "Saving..." : "Save Template"}</AuditButton>{templateId ? <AuditButton variant="secondary" onClick={() => mutations.transition.mutate({ action: "approve" })}>Approve</AuditButton> : null}</div>
  </AuditCard>;
}
function safeJson(value: string) { try { return JSON.parse(value); } catch { return value; } }
