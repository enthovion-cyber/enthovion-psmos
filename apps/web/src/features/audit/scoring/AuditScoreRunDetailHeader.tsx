"use client";
import { AuditButton } from "../shared/AuditUi";
import { AuditScoreGradeBadge } from "../shared/AuditScoreGradeBadge";
import { AuditScoreReadinessBadge } from "../shared/AuditScoreReadinessBadge";
import { AuditScoreStaleBadge } from "../shared/AuditScoreStaleBadge";
import { AuditScoreStatusBadge } from "../shared/AuditScoreStatusBadge";
import { useAuditScoreRunMutations } from "../hooks/useAuditScoreRunMutations";

export function AuditScoreRunDetailHeader({ run }: { run: Record<string, any> }) {
  const mutations = useAuditScoreRunMutations(run.id);
  const lockDisabled = run.stale_status !== "Current" ? "Stale scores cannot be locked. Recalculate first." : !["Calculated", "Verified", "Adjusted"].includes(run.score_status) ? "Only calculated, verified, or adjusted scores can be locked." : undefined;
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[var(--psm-muted)]">{run.score_code}</p><h1 className="text-2xl font-bold">{run.score_title}</h1><p className="text-sm text-[var(--psm-muted)]">{run.source_object_type} / {run.source_object_id}</p></div><div className="flex flex-wrap gap-2"><AuditScoreStatusBadge value={run.score_status} /><AuditScoreReadinessBadge value={run.readiness_status} /><AuditScoreStaleBadge value={run.stale_status} /><AuditScoreGradeBadge value={run.score_grade} /></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-4"><Metric label="Final score" value={run.final_score ?? "Not Determined"} /><Metric label="Original" value={run.original_calculated_score ?? "-"} /><Metric label="Adjusted" value={run.adjusted_score ?? "-"} /><Metric label="Methodology" value={run.methodology_version ?? "-"} /></div>
    <div className="mt-4 flex flex-wrap gap-2"><AuditButton onClick={() => mutations.recalculate.mutate()} variant="secondary">Recalculate</AuditButton><AuditButton onClick={() => mutations.verify.mutate({ comment: "Verified from score run header." })} disabled={run.score_status === "Input Missing"} title="Input-missing scores cannot be verified.">Verify</AuditButton><AuditButton onClick={() => mutations.lock.mutate({ reason: "Locked from score run header." })} disabled={Boolean(lockDisabled)} title={lockDisabled}>Lock</AuditButton><AuditButton onClick={() => mutations.unlock.mutate({ reason: "Controlled unlock from score run header." })} variant="secondary" disabled={run.score_status !== "Locked"} title="Only locked scores can be unlocked.">Unlock</AuditButton></div>
  </div>;
}
function Metric({ label, value }: { label: string; value: unknown }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><b>{String(value)}</b></div>; }
