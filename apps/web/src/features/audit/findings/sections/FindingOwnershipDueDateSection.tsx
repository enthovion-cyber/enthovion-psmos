import { Field, inputClass } from "../../shared/AuditUi";

export function FindingOwnershipDueDateSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context: Record<string, any> | undefined }) {
  const users = context?.users ?? [];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Owner"><select className={inputClass()} value={form.ownerUserId ?? ""} onChange={(event) => setForm({ ownerUserId: event.target.value || undefined })}><option value="">Awaiting owner</option>{users.map((user: any) => <option key={user.id} value={user.id}>{user.name ?? user.email} - {user.role ?? user.department ?? "User"}</option>)}</select></Field>
      <Field label="Reviewer"><select className={inputClass()} value={form.reviewerUserId ?? ""} onChange={(event) => setForm({ reviewerUserId: event.target.value || undefined })}><option value="">No reviewer</option>{users.map((user: any) => <option key={user.id} value={user.id}>{user.name ?? user.email}</option>)}</select></Field>
      <Field label="Responsible department"><input className={inputClass()} value={form.responsibleDepartmentId ?? ""} onChange={(event) => setForm({ responsibleDepartmentId: event.target.value })} /></Field>
      <Field label="Escalation owner foundation"><select className={inputClass()} value={form.escalationOwnerUserId ?? ""} onChange={(event) => setForm({ escalationOwnerUserId: event.target.value || undefined })}><option value="">No escalation owner</option>{users.map((user: any) => <option key={user.id} value={user.id}>{user.name ?? user.email}</option>)}</select></Field>
      <Field label="Due date"><input type="date" className={inputClass()} value={form.dueDate ?? ""} onChange={(event) => setForm({ dueDate: event.target.value })} /></Field>
      <Field label="Due date basis"><select className={inputClass()} value={form.dueDateBasis ?? ""} onChange={(event) => setForm({ dueDateBasis: event.target.value })}>{["","Severity-based","Regulatory requirement","Audit team recommendation","Site policy","Management decision","Custom"].map((item) => <option key={item} value={item}>{item || "Not set"}</option>)}</select></Field>
      <Field label="Target closure date foundation"><input type="date" className={inputClass()} value={form.targetClosureDate ?? ""} onChange={(event) => setForm({ targetClosureDate: event.target.value })} /></Field>
      <Field label="SLA category"><input className={inputClass()} value={form.slaCategory ?? ""} onChange={(event) => setForm({ slaCategory: event.target.value })} /></Field>
      <Field label="Owner notes"><textarea className={inputClass()} value={form.ownerNotes ?? ""} onChange={(event) => setForm({ ownerNotes: event.target.value })} rows={4} /></Field>
    </div>
  );
}
