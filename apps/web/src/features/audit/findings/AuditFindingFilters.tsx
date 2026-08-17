"use client";
import { Field, inputClass } from "../shared/AuditUi";

type Props = { value: Record<string, unknown>; onChange: (value: Record<string, unknown>) => void };

const statuses = ["", "Draft", "Open", "Under Review", "Needs More Information", "Confirmed", "Rejected", "Ready For CAPA", "Archived"];
const severities = ["", "Low", "Medium", "High", "Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"];
const types = ["", "Non-Conformance", "Major Non-Conformance", "Minor Non-Conformance", "Observation", "Opportunity For Improvement", "Safety-Critical Gap", "Regulatory Gap", "PSM System Gap", "PTW Gap", "MOC Gap", "PSSR Gap", "PSI Gap", "Mechanical Integrity Gap", "Training Gap", "Incident / CAPA Gap", "Custom"];
const priorities = ["", "Low", "Medium", "High", "Urgent", "Immediate"];

export function AuditFindingFilters({ value, onChange }: Props) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next || undefined });
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Search"><input className={inputClass()} value={String(value.search ?? "")} onChange={(event) => set("search", event.target.value)} placeholder="Code, title, description" /></Field>
      <Field label="Status"><select className={inputClass()} value={String(value.status ?? "")} onChange={(event) => set("status", event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item || "All statuses"}</option>)}</select></Field>
      <Field label="Finding type"><select className={inputClass()} value={String(value.findingType ?? "")} onChange={(event) => set("findingType", event.target.value)}>{types.map((item) => <option key={item} value={item}>{item || "All types"}</option>)}</select></Field>
      <Field label="Severity / criticality"><select className={inputClass()} value={String(value.severity ?? "")} onChange={(event) => set("severity", event.target.value)}>{severities.map((item) => <option key={item} value={item}>{item || "All severities"}</option>)}</select></Field>
      <Field label="Priority"><select className={inputClass()} value={String(value.priority ?? "")} onChange={(event) => set("priority", event.target.value)}>{priorities.map((item) => <option key={item} value={item}>{item || "All priorities"}</option>)}</select></Field>
      <Field label="CAPA readiness"><select className={inputClass()} value={String(value.capaReadinessStatus ?? "")} onChange={(event) => set("capaReadinessStatus", event.target.value)}>{["", "Not Ready", "Missing Classification", "Missing Owner", "Missing Due Date", "Missing Evidence", "Needs Confirmation", "Ready For CAPA", "CAPA Created Foundation"].map((item) => <option key={item} value={item}>{item || "All CAPA readiness"}</option>)}</select></Field>
      <Field label="Evidence status"><select className={inputClass()} value={String(value.evidenceStatus ?? "")} onChange={(event) => set("evidenceStatus", event.target.value)}>{["", "Not Required", "Missing", "Partial", "Linked", "Attached", "Verified Foundation", "Restricted"].map((item) => <option key={item} value={item}>{item || "All evidence statuses"}</option>)}</select></Field>
      <Field label="Sort"><select className={inputClass()} value={String(value.sort ?? "updated_at.desc")} onChange={(event) => set("sort", event.target.value)}><option value="updated_at.desc">Recently updated</option><option value="created_at.desc">Recently created</option><option value="due_date.asc">Due date</option><option value="finding_code.asc">Finding code</option></select></Field>
    </div>
  );
}
