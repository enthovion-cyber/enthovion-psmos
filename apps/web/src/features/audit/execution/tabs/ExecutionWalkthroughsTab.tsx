"use client";
import { useState } from "react";
import { AuditButton, AuditCard, AuditEmptyState, Field, inputClass } from "../../shared/AuditUi";
import { useAuditExecutionWalkthroughs } from "../../hooks/useAuditExecutionWalkthroughs";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";

export function ExecutionWalkthroughsTab({ detail }: { detail: AuditExecutionDetail }) {
  const mutations = useAuditExecutionWalkthroughs();
  const [form, setForm] = useState({ walkthroughTitle: "", observations: "", fieldConditions: "", followUpRequired: false });
  const set = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => mutations.add.mutate({ executionId: detail.execution.id, payload: form }, { onSuccess: () => setForm({ walkthroughTitle: "", observations: "", fieldConditions: "", followUpRequired: false }) });
  return <div className="grid gap-5 xl:grid-cols-[1fr_360px]"><AuditCard title="Walkthrough Register">{detail.walkthroughs.length ? <div className="space-y-2">{detail.walkthroughs.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold text-[var(--psm-fg)]">{row.walkthrough_title}</p><p className="text-sm text-[var(--psm-muted)]">{row.observations ?? "No observations"}</p></div>)}</div> : <AuditEmptyState title="No walkthroughs" message="No backend walkthrough rows were returned for this execution." />}</AuditCard><AuditCard title="Add walkthrough"><div className="space-y-3"><Field label="Title"><input className={inputClass()} value={form.walkthroughTitle} onChange={(e) => set("walkthroughTitle", e.target.value)} /></Field><Field label="Observations"><textarea className={inputClass()} value={form.observations} onChange={(e) => set("observations", e.target.value)} /></Field><Field label="Field conditions"><textarea className={inputClass()} value={form.fieldConditions} onChange={(e) => set("fieldConditions", e.target.value)} /></Field><label className="flex gap-2 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={form.followUpRequired} onChange={(e) => set("followUpRequired", e.target.checked)} /> Follow-up required</label><AuditButton onClick={save} disabled={!form.walkthroughTitle || mutations.add.isPending} title={!form.walkthroughTitle ? "Walkthrough title is required." : "Save walkthrough"}>{mutations.add.isPending ? "Saving..." : "Save Walkthrough"}</AuditButton></div></AuditCard></div>;
}
