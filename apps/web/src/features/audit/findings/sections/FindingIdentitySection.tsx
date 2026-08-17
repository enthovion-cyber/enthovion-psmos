import { Field, inputClass } from "../../shared/AuditUi";

export function FindingIdentitySection({ form, setForm }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Finding title"><input className={inputClass()} required value={form.findingTitle ?? ""} onChange={(event) => setForm({ findingTitle: event.target.value })} /></Field>
      <Field label="Finding code"><input className={inputClass()} value={form.findingCode ?? ""} onChange={(event) => setForm({ findingCode: event.target.value })} placeholder="Auto-generated if blank" /></Field>
      <Field label="Finding type"><select className={inputClass()} value={form.findingType ?? "Observation"} onChange={(event) => setForm({ findingType: event.target.value })}>{["Non-Conformance","Major Non-Conformance","Minor Non-Conformance","Observation","Opportunity For Improvement","Positive Practice","Safety-Critical Gap","Regulatory Gap","PSM System Gap","Procedure Gap","Training Gap","PTW Gap","MOC Gap","PSSR Gap","PSI Gap","Mechanical Integrity Gap","Incident / CAPA Gap","Document Control Gap","Equipment Integrity Gap","Housekeeping / Field Condition","Emergency Preparedness Gap","Contractor Management Gap","Management System Gap","Custom"].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Status"><select className={inputClass()} value={form.findingStatus ?? "Draft"} onChange={(event) => setForm({ findingStatus: event.target.value })}>{["Draft","Open","Under Review","Needs More Information"].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Short summary"><input className={inputClass()} value={form.shortSummary ?? ""} onChange={(event) => setForm({ shortSummary: event.target.value })} /></Field>
      <Field label="Priority"><select className={inputClass()} value={form.priority ?? ""} onChange={(event) => setForm({ priority: event.target.value })}>{["","Low","Medium","High","Urgent","Immediate"].map((item) => <option key={item} value={item}>{item || "Pending"}</option>)}</select></Field>
      <Field label="Finding description"><textarea className={inputClass()} value={form.findingDescription ?? ""} onChange={(event) => setForm({ findingDescription: event.target.value })} rows={5} /></Field>
      <Field label="Notes"><textarea className={inputClass()} value={form.notes ?? ""} onChange={(event) => setForm({ notes: event.target.value })} rows={5} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.immediateConcern)} onChange={(event) => setForm({ immediateConcern: event.target.checked })} /> Immediate concern</label>
      <label className="flex items-center gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.stopWorkRecommended)} onChange={(event) => setForm({ stopWorkRecommended: event.target.checked })} /> Stop-work recommended foundation</label>
    </div>
  );
}
