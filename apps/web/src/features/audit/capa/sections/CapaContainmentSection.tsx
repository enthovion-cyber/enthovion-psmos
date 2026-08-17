import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaContainmentSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  const containment = form.containment ?? {};
  const set = (patch: Record<string, any>) => setForm({ containment: { ...containment, ...patch } });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(containment.containmentRequired)} onChange={(e) => set({ containmentRequired: e.target.checked })} /> Immediate containment required</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(containment.stopWorkRecommendation)} onChange={(e) => set({ stopWorkRecommendation: e.target.checked })} /> Stop-work / restriction recommendation</label>
      <Field label="Containment owner"><select className={inputClass()} value={containment.containmentOwnerUserId ?? ""} onChange={(e) => set({ containmentOwnerUserId: e.target.value })}><option value="">Select owner</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="Containment due date"><input type="date" className={inputClass()} value={containment.containmentDueDate ?? ""} onChange={(e) => set({ containmentDueDate: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(containment.evidenceRequired)} onChange={(e) => set({ evidenceRequired: e.target.checked })} /> Containment evidence required</label>
      <Field label="Containment status"><input className={inputClass()} value={containment.containmentStatus ?? "Draft"} onChange={(e) => set({ containmentStatus: e.target.value })} /></Field>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">Containment action description</span><textarea className={inputClass()} rows={3} value={containment.containmentDescription ?? ""} onChange={(e) => set({ containmentDescription: e.target.value })} /></label>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">Interim control description / notes</span><textarea className={inputClass()} rows={3} value={containment.interimControlDescription ?? ""} onChange={(e) => set({ interimControlDescription: e.target.value })} /></label>
    </div>
  );
}
