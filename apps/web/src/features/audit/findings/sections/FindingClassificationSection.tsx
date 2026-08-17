import { Field, inputClass } from "../../shared/AuditUi";

export function FindingClassificationSection({ form, setForm }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Severity"><select className={inputClass()} value={form.severity ?? ""} onChange={(event) => setForm({ severity: event.target.value })}>{["","Low","Medium","High","Critical","Safety-Critical","Regulatory-Critical","PSM-Critical"].map((item) => <option key={item} value={item}>{item || "Not set"}</option>)}</select></Field>
      <Field label="Criticality"><select className={inputClass()} value={form.criticality ?? "Medium"} onChange={(event) => setForm({ criticality: event.target.value })}>{["Low","Medium","High","Critical","Safety-Critical","Regulatory-Critical","PSM-Critical"].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Risk potential"><select className={inputClass()} value={form.riskPotential ?? ""} onChange={(event) => setForm({ riskPotential: event.target.value })}>{["","Low","Medium","High","Major","Catastrophic"].map((item) => <option key={item} value={item}>{item || "Not set"}</option>)}</select></Field>
      <Field label="Recurrence category"><select className={inputClass()} value={form.recurrenceCategory ?? ""} onChange={(event) => setForm({ recurrenceCategory: event.target.value })}>{["","First Time","Repeat Same Area","Repeat Same Module","Repeat Same Standard","Repeat Same Equipment","Repeat Same Root Cause Foundation","Recurring Corporate Finding","Unknown"].map((item) => <option key={item} value={item}>{item || "Not checked"}</option>)}</select></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.safetyCritical)} onChange={(event) => setForm({ safetyCritical: event.target.checked })} /> Safety-critical</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.regulatoryCritical)} onChange={(event) => setForm({ regulatoryCritical: event.target.checked })} /> Regulatory-critical</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.psmCritical)} onChange={(event) => setForm({ psmCritical: event.target.checked })} /> PSM-critical</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.repeatFinding)} onChange={(event) => setForm({ repeatFinding: event.target.checked })} /> Repeat finding</label>
      <Field label="Classification rationale"><textarea className={inputClass()} value={form.classificationRationale ?? ""} onChange={(event) => setForm({ classificationRationale: event.target.value })} rows={4} /></Field>
    </div>
  );
}
