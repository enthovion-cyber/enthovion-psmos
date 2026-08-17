import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard } from "../../shared/AuditUi";
import { AuditFindingCapaReadinessBadge } from "../../shared/AuditFindingCapaReadinessBadge";
import { AuditFindingCriticalityBadge } from "../../shared/AuditFindingCriticalityBadge";
import { AuditFindingDuplicateBadge } from "../../shared/AuditFindingDuplicateBadge";
import { AuditFindingPriorityBadge } from "../../shared/AuditFindingPriorityBadge";
import { AuditFindingReadinessPanel } from "../AuditFindingReadinessPanel";

export function FindingOverviewTab({ detail }: { detail: AuditFindingDetail }) {
  const finding = detail.finding;
  return (
    <div className="space-y-4">
      <AuditCard title="Finding overview snapshot">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Type" value={finding.finding_type} />
          <Metric label="Priority" value={<AuditFindingPriorityBadge value={finding.priority} />} />
          <Metric label="Criticality" value={<AuditFindingCriticalityBadge value={finding.criticality} />} />
          <Metric label="Repeat / duplicate" value={<AuditFindingDuplicateBadge value={finding.duplicate_repeat_status} />} />
          <Metric label="Owner" value={finding.owner?.name ?? finding.owner_user_id ?? "Awaiting owner"} />
          <Metric label="Due date" value={finding.due_date ?? "Not set"} />
          <Metric label="Source" value={detail.sources[0]?.source_type ?? "Missing source"} />
          <Metric label="CAPA readiness" value={<AuditFindingCapaReadinessBadge value={finding.capa_readiness_status} />} />
        </div>
      </AuditCard>
      <AuditFindingReadinessPanel detail={detail} />
    </div>
  );
}
function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p><div className="mt-2 text-sm font-semibold text-[var(--psm-fg)]">{value}</div></div>;
}
