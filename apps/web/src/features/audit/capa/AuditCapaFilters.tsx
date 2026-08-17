import { inputClass } from "../shared/AuditUi";

export function AuditCapaFilters({ value, onChange }: { value: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next || undefined, page: 1 });
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <input className={inputClass()} placeholder="Search CAPA/finding" value={String(value.search ?? "")} onChange={(event) => set("search", event.target.value)} />
      <select className={inputClass()} value={String(value.status ?? "")} onChange={(event) => set("status", event.target.value)}>
        <option value="">All CAPA statuses</option>
        {["Draft","Open","Pending Assignment","In Progress","Overdue","Pending Verification","Verification Failed","Effectiveness Check Pending","Ready For Closure","Closed","Reopened","Archived"].map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className={inputClass()} value={String(value.priority ?? "")} onChange={(event) => set("priority", event.target.value)}>
        <option value="">All priorities</option>
        {["Low","Medium","High","Urgent","Immediate"].map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className={inputClass()} value={String(value.criticality ?? "")} onChange={(event) => set("criticality", event.target.value)}>
        <option value="">All criticality</option>
        {["Low","Medium","High","Critical","Safety-Critical","Regulatory-Critical","PSM-Critical"].map((item) => <option key={item}>{item}</option>)}
      </select>
      <input className={inputClass()} placeholder="Owner user ID" value={String(value.ownerUserId ?? "")} onChange={(event) => set("ownerUserId", event.target.value)} />
      <input className={inputClass()} placeholder="Source finding ID" value={String(value.findingId ?? "")} onChange={(event) => set("findingId", event.target.value)} />
    </div>
  );
}
