import { Field, inputClass } from "../../shared/AuditUi";

export function FindingScopeSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context: Record<string, any> | undefined }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Site"><select className={inputClass()} value={form.siteId ?? ""} onChange={(event) => setForm({ siteId: event.target.value || undefined })}><option value="">Company-wide</option>{(context?.sites ?? []).map((row: any) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
      <Field label="Unit"><select className={inputClass()} value={form.unitId ?? ""} onChange={(event) => setForm({ unitId: event.target.value || undefined })}><option value="">No unit</option>{(context?.units ?? []).map((row: any) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
      <Field label="Area"><select className={inputClass()} value={form.areaId ?? ""} onChange={(event) => setForm({ areaId: event.target.value || undefined })}><option value="">No area</option>{(context?.areas ?? []).map((row: any) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
      <Field label="Equipment / process system"><input className={inputClass()} value={form.equipmentId ?? ""} onChange={(event) => setForm({ equipmentId: event.target.value })} /></Field>
      <Field label="Audit program"><select className={inputClass()} value={form.programId ?? ""} onChange={(event) => setForm({ programId: event.target.value || undefined })}><option value="">No program</option>{(context?.programs ?? []).map((row: any) => <option key={row.id} value={row.id}>{row.program_code} - {row.program_title}</option>)}</select></Field>
      <Field label="Audit plan"><select className={inputClass()} value={form.planId ?? ""} onChange={(event) => setForm({ planId: event.target.value || undefined })}><option value="">No plan</option>{(context?.plans ?? []).map((row: any) => <option key={row.id} value={row.id}>{row.plan_code} - {row.plan_title}</option>)}</select></Field>
      <Field label="Contractor / affected role foundation"><input className={inputClass()} value={form.contractorCompany ?? ""} onChange={(event) => setForm({ contractorCompany: event.target.value })} /></Field>
      <Field label="Scope justification"><textarea className={inputClass()} value={form.scopeJustification ?? ""} onChange={(event) => setForm({ scopeJustification: event.target.value })} rows={4} /></Field>
    </div>
  );
}
