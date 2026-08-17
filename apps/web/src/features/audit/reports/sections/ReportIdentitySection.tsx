import { Field, inputClass } from "../../shared/AuditUi";
export function ReportIdentitySection({ value, set }: { value: Record<string, unknown>; set: (key: string, value: unknown) => void }) {
  return <div className="grid gap-3 md:grid-cols-2">
    <Field label="Report title"><input className={inputClass()} value={String(value.reportTitle ?? "")} onChange={(e) => set("reportTitle", e.target.value)} placeholder="Audit closeout report" /></Field>
    <Field label="Report type"><select className={inputClass()} value={String(value.reportType ?? "Program Summary")} onChange={(e) => set("reportType", e.target.value)}>{["Program Summary","Plan Report","Execution Report","Finding Report","CAPA Report","Evidence Manifest","Scoring Report","Standards Traceability","Review Approval Package","Custom"].map((v) => <option key={v}>{v}</option>)}</select></Field>
    <Field label="Report description"><textarea className={inputClass()} value={String(value.reportDescription ?? "")} onChange={(e) => set("reportDescription", e.target.value)} /></Field>
    <Field label="Intended audience"><select className={inputClass()} value={String(value.intendedAudience ?? "Internal")} onChange={(e) => set("intendedAudience", e.target.value)}>{["Internal","Site Leadership","Corporate","Regulator","Third Party Auditor","Management Review","Restricted"].map((v) => <option key={v}>{v}</option>)}</select></Field>
  </div>;
}
