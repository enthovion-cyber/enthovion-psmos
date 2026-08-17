import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaVerificationRulesSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  const verification = form.verification ?? {};
  const set = (patch: Record<string, any>) => setForm({ verification: { ...verification, ...patch } });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={verification.verificationRequired !== false} onChange={(e) => set({ verificationRequired: e.target.checked })} /> Verification required</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(verification.evidenceRequired)} onChange={(e) => set({ evidenceRequired: e.target.checked })} /> Evidence required for verification</label>
      <Field label="Verifier user / role"><select className={inputClass()} value={verification.verifierUserId ?? ""} onChange={(e) => set({ verifierUserId: e.target.value })}><option value="">Select verifier</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="Verification method"><select className={inputClass()} value={verification.verificationMethod ?? "Document Review"} onChange={(e) => set({ verificationMethod: e.target.value })}>{(context?.lookups.verificationMethods ?? ["Document Review"]).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Verification due date"><input type="date" className={inputClass()} value={verification.verificationDueDate ?? ""} onChange={(e) => set({ verificationDueDate: e.target.value })} /></Field>
      <Field label="Verification notes"><input className={inputClass()} value={verification.verificationNotes ?? ""} onChange={(e) => set({ verificationNotes: e.target.value })} /></Field>
    </div>
  );
}
