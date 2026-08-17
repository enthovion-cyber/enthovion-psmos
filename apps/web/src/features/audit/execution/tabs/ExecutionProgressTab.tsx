"use client";
import { AuditButton, AuditCard } from "../../shared/AuditUi";
import { useAuditExecutionMutations } from "../../hooks/useAuditExecutionMutations";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";

export function ExecutionProgressTab({ detail }: { detail: AuditExecutionDetail }) {
  const mutations = useAuditExecutionMutations();
  const readiness = detail.readiness;
  const checks = [
    ["Mandatory items answered", readiness?.mandatory_items_answered],
    ["Required comments complete", readiness?.required_comments_complete],
    ["Required evidence complete", readiness?.required_evidence_complete],
    ["N/A justifications complete", readiness?.na_justifications_complete],
    ["Safety critical items reviewed", readiness?.safety_critical_items_reviewed],
    ["Validation errors resolved", readiness?.validation_errors_resolved],
    ["Lead auditor review complete", readiness?.lead_auditor_review_complete],
  ];
  return <div className="grid gap-5 xl:grid-cols-2"><AuditCard title="Execution Progress"><div className="space-y-3">{Object.entries(detail.progress ?? {}).map(([key, value]) => <div key={key} className="flex justify-between rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span className="text-[var(--psm-muted)]">{key}</span><span className="font-semibold text-[var(--psm-fg)]">{String(value)}</span></div>)}</div></AuditCard><AuditCard title="Readiness Checklist" action={<AuditButton onClick={() => mutations.readiness.mutate(detail.execution.id)} disabled={mutations.readiness.isPending}>{mutations.readiness.isPending ? "Checking..." : "Run Readiness"}</AuditButton>}><div className="space-y-2">{checks.map(([label, ok]) => <div key={String(label)} className="flex justify-between rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span className="text-[var(--psm-fg)]">{label}</span><span className={ok ? "text-emerald-600" : "text-danger"}>{ok ? "Complete" : "Missing"}</span></div>)}</div></AuditCard></div>;
}
