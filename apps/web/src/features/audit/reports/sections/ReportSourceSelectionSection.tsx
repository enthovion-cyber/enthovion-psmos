import { Field, inputClass } from "../../shared/AuditUi";
export function ReportSourceSelectionSection({ value, set }: { value: Record<string, unknown>; set: (key: string, value: unknown) => void }) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Field label="Source module"><select className={inputClass()} value={String(value.sourceModule ?? "program")} onChange={(e) => set("sourceModule", e.target.value)}>{["program","plan","execution","finding","capa","evidence","scoring","standards-mapping","approval"].map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
    <Field label="Source record ID"><input className={inputClass()} value={String(value.sourceRecordId ?? "")} onChange={(e) => set("sourceRecordId", e.target.value)} placeholder="Paste existing source record ID" /></Field>
    <Field label="Site ID / scope override"><input className={inputClass()} value={String(value.siteId ?? "")} onChange={(e) => set("siteId", e.target.value)} placeholder="Optional; backend enforces access" /></Field>
    <p className="md:col-span-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">Reports are generated only from real source records. The backend stores an immutable source snapshot and marks reports stale when source data changes.</p>
  </div>;
}
