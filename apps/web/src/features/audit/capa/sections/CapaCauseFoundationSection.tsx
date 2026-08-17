import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaCauseFoundationSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Suspected cause"><input className={inputClass()} value={form.suspectedCause ?? ""} onChange={(e) => setForm({ suspectedCause: e.target.value })} /></Field>
      <Field label="Cause category"><select className={inputClass()} value={form.causeCategory ?? ""} onChange={(e) => setForm({ causeCategory: e.target.value })}><option value="">Select category</option>{(context?.lookups.causeCategories ?? []).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="System weakness foundation"><input className={inputClass()} value={form.systemWeakness ?? ""} onChange={(e) => setForm({ systemWeakness: e.target.value })} /></Field>
      <Field label="RCA method foundation"><input className={inputClass()} value={form.rcaMethod ?? ""} onChange={(e) => setForm({ rcaMethod: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.rcaRequired)} onChange={(e) => setForm({ rcaRequired: e.target.checked })} /> Root cause analysis required</label>
      <Field label="RCA link foundation"><input className={inputClass()} value={form.rcaRecordId ?? ""} onChange={(e) => setForm({ rcaRecordId: e.target.value })} /></Field>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">Cause notes / contributing factors</span><textarea className={inputClass()} rows={4} value={form.causeNotes ?? ""} onChange={(e) => setForm({ causeNotes: e.target.value })} /></label>
    </div>
  );
}
