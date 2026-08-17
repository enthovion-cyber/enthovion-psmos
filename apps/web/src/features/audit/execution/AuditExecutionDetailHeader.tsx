import { AuditButton } from "../shared/AuditUi";
import { AuditEvidenceStatusBadge } from "../shared/AuditEvidenceStatusBadge";
import { AuditExecutionProgressBadge } from "../shared/AuditExecutionProgressBadge";
import { AuditExecutionStatusBadge } from "../shared/AuditExecutionStatusBadge";
import type { AuditExecutionRow } from "../types/audit-execution.types";

export function AuditExecutionDetailHeader({ execution, onAction, busy }: { execution: AuditExecutionRow; onAction?: (action: string) => void; busy?: boolean }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Audit Execution</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{execution.execution_code} - {execution.execution_title}</h1>
          <div className="mt-3 flex flex-wrap gap-2"><AuditExecutionStatusBadge status={execution.execution_status} /><AuditExecutionProgressBadge value={execution.progress_percent} /><AuditEvidenceStatusBadge status={execution.evidence_status} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuditButton href={`/audit-compliance/execution/${execution.id}/workspace`} variant="secondary">Workspace</AuditButton>
          <AuditButton onClick={() => onAction?.("pause")} disabled={busy || execution.execution_status !== "In Progress"} title={execution.execution_status !== "In Progress" ? "Only in-progress executions can be paused." : "Pause execution"} variant="secondary">Pause</AuditButton>
          <AuditButton onClick={() => onAction?.("resume")} disabled={busy || execution.execution_status !== "Paused"} title={execution.execution_status !== "Paused" ? "Only paused executions can be resumed." : "Resume execution"} variant="secondary">Resume</AuditButton>
          <AuditButton onClick={() => onAction?.("complete")} disabled={busy || execution.pending_items > 0 || execution.evidence_missing_count > 0} title={execution.pending_items > 0 ? "Complete all required responses first." : execution.evidence_missing_count > 0 ? "Link all required evidence first." : "Complete execution"}>Complete</AuditButton>
        </div>
      </div>
    </header>
  );
}
