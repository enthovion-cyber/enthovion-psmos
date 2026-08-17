import { AuditCard } from "../shared/AuditUi";
import { AuditStalePackageBadge } from "../shared/AuditStalePackageBadge";
export function AuditApprovalStaleWarningPanel({ status, reason }: { status?: string | null; reason?: string | null }) {
  return <AuditCard title="Stale Package Detection"><div className="flex items-center gap-3"><AuditStalePackageBadge status={status} /><span className="text-sm text-[var(--psm-muted)]">{reason ?? "Source snapshot is current."}</span></div></AuditCard>;
}
