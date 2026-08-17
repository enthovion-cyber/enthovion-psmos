import { Field, inputClass } from "../shared/AuditUi";

export function AuditEvidenceFilters({ value, onChange, context }: { value: Record<string, any>; onChange: (value: Record<string, any>) => void; context?: Record<string, any> | undefined }) {
  const set = (key: string, v: string) => onChange({ ...value, [key]: v || undefined });
  const lookups = context?.lookups ?? {};
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Search"><input className={inputClass()} value={value.search ?? ""} onChange={(e) => set("search", e.target.value)} placeholder="Code, title, description" /></Field>
      <Field label="Site"><select className={inputClass()} value={value.siteId ?? ""} onChange={(e) => set("siteId", e.target.value)}><option value="">All accessible sites</option>{(context?.sites ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <Field label="Evidence status"><select className={inputClass()} value={value.status ?? ""} onChange={(e) => set("status", e.target.value)}><option value="">All statuses</option>{(lookups.evidenceStatuses ?? []).map((s: string) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Evidence type"><select className={inputClass()} value={value.evidenceType ?? ""} onChange={(e) => set("evidenceType", e.target.value)}><option value="">All types</option>{(lookups.evidenceTypes ?? []).map((s: string) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Review status"><select className={inputClass()} value={value.reviewStatus ?? ""} onChange={(e) => set("reviewStatus", e.target.value)}><option value="">All review states</option>{(lookups.evidenceReviewStatuses ?? []).map((s: string) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Readiness"><select className={inputClass()} value={value.readinessStatus ?? ""} onChange={(e) => set("readinessStatus", e.target.value)}><option value="">All readiness states</option>{(lookups.evidenceReadinessStatuses ?? []).map((s: string) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Confidentiality"><select className={inputClass()} value={value.confidentialityLevel ?? ""} onChange={(e) => set("confidentialityLevel", e.target.value)}><option value="">All classifications</option>{(lookups.evidenceConfidentialityLevels ?? []).map((s: string) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Sort"><select className={inputClass()} value={value.sort ?? "updated_at.desc"} onChange={(e) => set("sort", e.target.value)}><option value="updated_at.desc">Recently updated</option><option value="evidence_code.asc">Evidence code</option><option value="evidence_title.asc">Evidence title</option><option value="evidence_status.asc">Status</option></select></Field>
    </div>
  );
}
