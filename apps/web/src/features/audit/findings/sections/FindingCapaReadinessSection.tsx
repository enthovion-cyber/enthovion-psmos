import { Field, inputClass } from "../../shared/AuditUi";

export function FindingCapaReadinessSection({ form, setForm }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.capaRequired)} onChange={(event) => setForm({ capaRequired: event.target.checked })} /> CAPA required</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.immediateContainmentNeeded)} onChange={(event) => setForm({ immediateContainmentNeeded: event.target.checked })} /> Immediate containment needed</label>
      <Field label="CAPA required reason"><textarea className={inputClass()} value={form.capaRequiredReason ?? ""} onChange={(event) => setForm({ capaRequiredReason: event.target.value })} rows={4} /></Field>
      <Field label="Suggested corrective action"><textarea className={inputClass()} value={form.suggestedCorrectiveAction ?? ""} onChange={(event) => setForm({ suggestedCorrectiveAction: event.target.value })} rows={4} /></Field>
      <Field label="Suggested preventive action"><textarea className={inputClass()} value={form.suggestedPreventiveAction ?? ""} onChange={(event) => setForm({ suggestedPreventiveAction: event.target.value })} rows={4} /></Field>
      <Field label="Action owner recommendation"><input className={inputClass()} value={form.actionOwnerRecommendation ?? ""} onChange={(event) => setForm({ actionOwnerRecommendation: event.target.value })} /></Field>
      <Field label="Action due date recommendation"><input type="date" className={inputClass()} value={form.actionDueDateRecommendation ?? ""} onChange={(event) => setForm({ actionDueDateRecommendation: event.target.value })} /></Field>
      <Field label="CAPA link foundation"><input className={inputClass()} value={form.capaRecordId ?? ""} onChange={(event) => setForm({ capaRecordId: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.verificationRequiredFoundation)} onChange={(event) => setForm({ verificationRequiredFoundation: event.target.checked })} /> Verification required foundation</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.effectivenessCheckRequiredFoundation)} onChange={(event) => setForm({ effectivenessCheckRequiredFoundation: event.target.checked })} /> Effectiveness check foundation</label>
    </div>
  );
}
