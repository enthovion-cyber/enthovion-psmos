"use client";
import { Field, inputClass } from "../shared/AuditUi";

export function AuditExecutionFilters({ value, onChange }: { value: Record<string, unknown>; onChange: (value: Record<string, unknown>) => void }) {
  const set = (key: string, next: string) => onChange({ ...value, [key]: next || undefined });
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Field label="Search"><input className={inputClass()} value={String(value.search ?? "")} onChange={(event) => set("search", event.target.value)} placeholder="Code or title" /></Field>
      <Field label="Status"><select className={inputClass()} value={String(value.status ?? "")} onChange={(event) => set("status", event.target.value)}><option value="">All statuses</option><option>Ready To Start</option><option>In Progress</option><option>Paused</option><option>Blocked</option><option>Completed</option><option>Cancelled</option></select></Field>
      <Field label="Evidence"><select className={inputClass()} value={String(value.evidenceStatus ?? "")} onChange={(event) => set("evidenceStatus", event.target.value)}><option value="">All evidence states</option><option>Not Required</option><option>Complete</option><option>Missing Evidence</option></select></Field>
      <Field label="Criticality"><select className={inputClass()} value={String(value.criticality ?? "")} onChange={(event) => set("criticality", event.target.value)}><option value="">All criticalities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Safety-Critical</option><option>Regulatory-Critical</option></select></Field>
    </div>
  );
}
