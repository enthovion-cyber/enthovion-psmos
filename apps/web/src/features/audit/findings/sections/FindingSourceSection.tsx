import { Field, inputClass } from "../../shared/AuditUi";

export function FindingSourceSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context: Record<string, any> | undefined }) {
  const sourceTypes = context?.lookups?.findingSourceTypes ?? ["Manual Finding"];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Source type"><select className={inputClass()} value={form.sourceType ?? "Manual Finding"} onChange={(event) => setForm({ sourceType: event.target.value })}>{sourceTypes.map((item: string) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Audit execution"><select className={inputClass()} value={form.executionId ?? ""} onChange={(event) => setForm({ executionId: event.target.value || undefined })}><option value="">No execution source</option>{(context?.executions ?? []).map((row: any) => <option key={row.id} value={row.id}>{row.execution_code} - {row.execution_title}</option>)}</select></Field>
      <Field label="Checklist / response ID"><input className={inputClass()} value={form.responseId ?? ""} onChange={(event) => setForm({ responseId: event.target.value })} /></Field>
      <Field label="Field finding ID"><input className={inputClass()} value={form.fieldFindingId ?? ""} onChange={(event) => setForm({ fieldFindingId: event.target.value })} /></Field>
      <Field label="Source description"><textarea className={inputClass()} value={form.sourceDescription ?? ""} onChange={(event) => setForm({ sourceDescription: event.target.value })} rows={4} /></Field>
      <Field label="Manual source reason"><textarea className={inputClass()} value={form.manualSourceReason ?? ""} onChange={(event) => setForm({ manualSourceReason: event.target.value })} rows={4} /></Field>
    </div>
  );
}
