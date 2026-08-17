import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard } from "../../shared/AuditUi";
import { AuditFindingCriticalityBadge } from "../../shared/AuditFindingCriticalityBadge";
import { AuditFindingPriorityBadge } from "../../shared/AuditFindingPriorityBadge";
import { AuditFindingSeverityBadge } from "../../shared/AuditFindingSeverityBadge";
import { AuditFindingTypeBadge } from "../../shared/AuditFindingTypeBadge";

export function FindingClassificationTab({ detail }: { detail: AuditFindingDetail }) {
  const row = detail.finding;
  return (
    <AuditCard title="Classification / severity / priority / criticality">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Finding type" value={<AuditFindingTypeBadge value={row.finding_type} />} />
        <Info label="Severity" value={<AuditFindingSeverityBadge value={row.severity} />} />
        <Info label="Priority" value={<AuditFindingPriorityBadge value={row.priority} />} />
        <Info label="Criticality" value={<AuditFindingCriticalityBadge value={row.criticality} />} />
        <Info label="Risk potential" value={row.risk_potential ?? "Not set"} />
        <Info label="Safety-critical" value={row.safety_critical ? "Yes" : "No"} />
        <Info label="Regulatory-critical" value={row.regulatory_critical ? "Yes" : "No"} />
        <Info label="PSM-critical" value={row.psm_critical ? "Yes" : "No"} />
        <Info label="Recurrence" value={row.recurrence_category ?? "Not checked"} />
        <Info label="Immediate concern" value={row.immediate_concern ? "Yes" : "No"} />
        <Info label="Stop-work recommended" value={row.stop_work_recommended ? "Yes" : "No"} />
      </div>
      <p className="mt-4 text-sm text-[var(--psm-muted)]">{row.classification_rationale ?? "No classification rationale saved."}</p>
    </AuditCard>
  );
}
function Info({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p><div className="mt-2 font-semibold text-[var(--psm-fg)]">{value}</div></div>;
}
