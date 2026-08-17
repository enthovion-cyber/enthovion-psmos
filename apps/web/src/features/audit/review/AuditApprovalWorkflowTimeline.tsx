import { AuditCard } from "../shared/AuditUi";
export function AuditApprovalWorkflowTimeline({ stages = [] }: { stages?: Record<string, unknown>[] }) {
  return <AuditCard title="Review Workflow Timeline">{stages.length ? <ol className="space-y-2">{stages.map((stage, index) => <li key={String(stage.id ?? index)} className="rounded-lg bg-[var(--psm-surface-2)] p-3">{String(stage.stage_order ?? index + 1)}. {String(stage.stage_name ?? "Approval stage")} · {String(stage.stage_status ?? "Pending")}</li>)}</ol> : <p className="text-sm text-[var(--psm-muted)]">No workflow stages configured.</p>}</AuditCard>;
}
