import { Field, inputClass } from "../../shared/AuditUi";

export function FindingStandardModuleSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context: Record<string, any> | undefined }) {
  const modules = context?.lookups?.auditableModules ?? [];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Standard / regulation"><select className={inputClass()} value={form.standardName ?? ""} onChange={(event) => setForm({ standardName: event.target.value })}>{["","OSHA PSM","EPA RMP","ISO 45001","ISO 14001","ISO 9001","Responsible Care","Company Standard","Site Procedure","Corporate PSM Standard","Local Regulation","Insurance / Loss Prevention Requirement","Industry Best Practice","Custom"].map((item) => <option key={item} value={item}>{item || "No standard link"}</option>)}</select></Field>
      <Field label="Jurisdiction"><input className={inputClass()} value={form.jurisdiction ?? ""} onChange={(event) => setForm({ jurisdiction: event.target.value })} /></Field>
      <Field label="Clause / section reference"><input className={inputClass()} value={form.clauseReference ?? ""} onChange={(event) => setForm({ clauseReference: event.target.value })} /></Field>
      <Field label="Requirement category"><input className={inputClass()} value={form.requirementCategory ?? ""} onChange={(event) => setForm({ requirementCategory: event.target.value })} /></Field>
      <Field label="Module affected"><select className={inputClass()} value={form.moduleKey ?? ""} onChange={(event) => {
        const selected = modules.find((module: any) => module.key === event.target.value);
        setForm({ moduleKey: event.target.value || undefined, moduleName: selected?.label ?? "" });
      }}><option value="">No module link</option>{modules.map((module: any) => <option key={module.key} value={module.key}>{module.label}</option>)}</select></Field>
      <Field label="Related module record ID"><input className={inputClass()} value={form.relatedRecordId ?? ""} onChange={(event) => setForm({ relatedRecordId: event.target.value })} /></Field>
      <Field label="Evidence expectation"><textarea className={inputClass()} value={form.evidenceExpectation ?? ""} onChange={(event) => setForm({ evidenceExpectation: event.target.value })} rows={4} /></Field>
      <Field label="Impact / notes"><textarea className={inputClass()} value={form.impactDescription ?? ""} onChange={(event) => setForm({ impactDescription: event.target.value })} rows={4} /></Field>
    </div>
  );
}
