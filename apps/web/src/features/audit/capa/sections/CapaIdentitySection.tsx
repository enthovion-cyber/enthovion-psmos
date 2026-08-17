import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaIdentitySection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="CAPA title"><input className={inputClass()} value={form.capaTitle ?? ""} onChange={(e) => setForm({ capaTitle: e.target.value })} /></Field>
      <Field label="CAPA code"><input className={inputClass()} placeholder="Auto-generated if blank" value={form.capaCode ?? ""} onChange={(e) => setForm({ capaCode: e.target.value })} /></Field>
      <Field label="CAPA category"><select className={inputClass()} value={form.capaCategory ?? ""} onChange={(e) => setForm({ capaCategory: e.target.value })}>{(context?.lookups.capaCategories ?? []).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="CAPA status"><select className={inputClass()} value={form.capaStatus ?? "Draft"} onChange={(e) => setForm({ capaStatus: e.target.value })}>{(context?.lookups.capaStatuses ?? ["Draft","Open"]).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Criticality"><select className={inputClass()} value={form.criticality ?? "Medium"} onChange={(e) => setForm({ criticality: e.target.value })}>{(context?.lookups.criticalityLevels ?? ["Medium"]).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Priority"><select className={inputClass()} value={form.priority ?? "Medium"} onChange={(e) => setForm({ priority: e.target.value })}>{(context?.lookups.priorities ?? ["Medium"]).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="CAPA objective"><input className={inputClass()} value={form.capaObjective ?? ""} onChange={(e) => setForm({ capaObjective: e.target.value })} /></Field>
      <Field label="Notes"><input className={inputClass()} value={form.notes ?? ""} onChange={(e) => setForm({ notes: e.target.value })} /></Field>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">CAPA description</span><textarea className={inputClass()} rows={4} value={form.capaDescription ?? ""} onChange={(e) => setForm({ capaDescription: e.target.value })} /></label>
    </div>
  );
}
