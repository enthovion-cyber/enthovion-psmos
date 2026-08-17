import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaSourceFindingsSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  const selected = context?.findings.find((finding) => finding.id === form.primaryFindingId);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Primary finding"><select className={inputClass()} value={form.primaryFindingId ?? ""} onChange={(e) => setForm({ primaryFindingId: e.target.value })}><option value="">Select confirmed / ready-for-CAPA finding</option>{(context?.readyFindings ?? []).map((finding) => <option key={finding.id} value={finding.id}>{finding.finding_code} - {finding.finding_title}</option>)}</select></Field>
        <Field label="Grouping reason"><input className={inputClass()} value={form.groupingReason ?? ""} onChange={(e) => setForm({ groupingReason: e.target.value })} /></Field>
      </div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm">
        <h3 className="font-semibold text-[var(--psm-fg)]">Source snapshot</h3>
        {selected ? <dl className="mt-3 grid gap-2 md:grid-cols-2">{["finding_code","finding_title","finding_status","capa_readiness_status","severity","criticality"].map((key) => <div key={key}><dt className="text-[var(--psm-muted)]">{key}</dt><dd className="text-[var(--psm-fg)]">{selected[key] ?? "-"}</dd></div>)}</dl> : <p className="mt-2 text-[var(--psm-muted)]">Select a backend finding. The API stores a source snapshot and validates finding access/scope before CAPA creation.</p>}
      </div>
    </div>
  );
}
