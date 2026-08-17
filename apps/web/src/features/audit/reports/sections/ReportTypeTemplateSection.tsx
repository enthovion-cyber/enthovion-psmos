import { Field, inputClass } from "../../shared/AuditUi";
export function ReportTypeTemplateSection({ value, set, templates = [] }: { value: Record<string, unknown>; set: (key: string, value: unknown) => void; templates?: Record<string, unknown>[] }) {
  return <div className="grid gap-3 md:grid-cols-2">
    <Field label="Template"><select className={inputClass()} value={String(value.templateId ?? "")} onChange={(e) => set("templateId", e.target.value)}><option value="">No template selected</option>{templates.map((template) => <option key={String(template.id)} value={String(template.id)}>{String(template.template_name ?? template.template_code ?? template.id)}</option>)}</select></Field>
    <Field label="Confidentiality"><select className={inputClass()} value={String(value.confidentialityLevel ?? "Internal")} onChange={(e) => set("confidentialityLevel", e.target.value)}>{["Public","Internal","Confidential","Restricted","Regulatory Sensitive","Legal Privileged"].map((v) => <option key={v}>{v}</option>)}</select></Field>
  </div>;
}
