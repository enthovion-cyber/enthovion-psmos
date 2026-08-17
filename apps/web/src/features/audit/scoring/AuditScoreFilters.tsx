import { Field, inputClass } from "../shared/AuditUi";
export function AuditScoreFilters({ filters, setFilters }: { filters: Record<string, unknown>; setFilters: (filters: Record<string, unknown>) => void }) {
  return <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
    <Field label="Search"><input className={inputClass()} value={String(filters.search ?? "")} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Score code, title, source" /></Field>
    <Field label="Status"><select className={inputClass()} value={String(filters.status ?? "")} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}><option value="">All statuses</option>{["Calculated","Input Missing","Needs Recalculation","Pending Verification","Verified","Adjusted","Locked","Failed","Archived"].map((s) => <option key={s}>{s}</option>)}</select></Field>
    <Field label="Stale status"><select className={inputClass()} value={String(filters.staleStatus ?? "")} onChange={(e) => setFilters({ ...filters, staleStatus: e.target.value || undefined })}><option value="">All stale states</option>{["Current","Stale","Potentially Stale","Superseded"].map((s) => <option key={s}>{s}</option>)}</select></Field>
    <Field label="Grade"><select className={inputClass()} value={String(filters.grade ?? "")} onChange={(e) => setFilters({ ...filters, grade: e.target.value || undefined })}><option value="">All grades</option>{["A","B","C","D","F","Not Determined"].map((s) => <option key={s}>{s}</option>)}</select></Field>
  </div>;
}
