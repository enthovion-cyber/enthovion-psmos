import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaOwnershipDueDateSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="CAPA owner"><select className={inputClass()} value={form.capaOwnerUserId ?? ""} onChange={(e) => setForm({ capaOwnerUserId: e.target.value })}><option value="">Select owner</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="CAPA reviewer"><select className={inputClass()} value={form.reviewerUserId ?? ""} onChange={(e) => setForm({ reviewerUserId: e.target.value })}><option value="">Select reviewer</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="Escalation owner"><select className={inputClass()} value={form.escalationOwnerUserId ?? ""} onChange={(e) => setForm({ escalationOwnerUserId: e.target.value })}><option value="">Select escalation owner</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="Overall due date"><input type="date" className={inputClass()} value={form.overallDueDate ?? ""} onChange={(e) => setForm({ overallDueDate: e.target.value })} /></Field>
      <Field label="Responsible department"><input className={inputClass()} value={form.responsibleDepartmentId ?? ""} onChange={(e) => setForm({ responsibleDepartmentId: e.target.value })} /></Field>
      <Field label="Severity-based SLA"><input className={inputClass()} value={form.severitySlaCategory ?? ""} onChange={(e) => setForm({ severitySlaCategory: e.target.value })} /></Field>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">Owner notes / escalation rule foundation</span><textarea className={inputClass()} rows={3} value={form.ownerNotes ?? ""} onChange={(e) => setForm({ ownerNotes: e.target.value })} /></label>
    </div>
  );
}
