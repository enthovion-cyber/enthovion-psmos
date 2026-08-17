import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaEffectivenessSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  const effectiveness = form.effectiveness ?? {};
  const set = (patch: Record<string, any>) => setForm({ effectiveness: { ...effectiveness, ...patch } });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(effectiveness.effectivenessRequired)} onChange={(e) => set({ effectivenessRequired: e.target.checked, effectivenessStatus: e.target.checked ? "Required" : "Not Required" })} /> Effectiveness check required</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(effectiveness.followUpAuditRequired)} onChange={(e) => set({ followUpAuditRequired: e.target.checked })} /> Follow-up audit required foundation</label>
      <Field label="Effectiveness owner"><select className={inputClass()} value={effectiveness.effectivenessOwnerUserId ?? ""} onChange={(e) => set({ effectivenessOwnerUserId: e.target.value })}><option value="">Select owner</option>{(context?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}</select></Field>
      <Field label="Effectiveness method"><select className={inputClass()} value={effectiveness.effectivenessMethod ?? ""} onChange={(e) => set({ effectivenessMethod: e.target.value })}><option value="">Select method</option>{(context?.lookups.effectivenessMethods ?? []).map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Effectiveness due date"><input type="date" className={inputClass()} value={effectiveness.effectivenessDueDate ?? ""} onChange={(e) => set({ effectivenessDueDate: e.target.value })} /></Field>
      <Field label="Repeat finding watch window days"><input type="number" className={inputClass()} value={effectiveness.repeatFindingWatchWindowDays ?? ""} onChange={(e) => set({ repeatFindingWatchWindowDays: e.target.value })} /></Field>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-[var(--psm-fg)]">Effectiveness criteria / notes</span><textarea className={inputClass()} rows={3} value={effectiveness.effectivenessCriteria ?? ""} onChange={(e) => set({ effectivenessCriteria: e.target.value })} /></label>
    </div>
  );
}
