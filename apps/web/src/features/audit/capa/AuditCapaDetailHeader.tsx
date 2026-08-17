import Link from "next/link";
import type { AuditCapaDetail } from "../types/audit-capa.types";
import { AuditButton, AuditCard } from "../shared/AuditUi";
import { AuditCapaClosureReadinessBadge } from "../shared/AuditCapaClosureReadinessBadge";
import { AuditCapaEffectivenessStatusBadge } from "../shared/AuditCapaEffectivenessStatusBadge";
import { AuditCapaPriorityBadge } from "../shared/AuditCapaPriorityBadge";
import { AuditCapaStatusBadge } from "../shared/AuditCapaStatusBadge";
import { AuditCapaVerificationStatusBadge } from "../shared/AuditCapaVerificationStatusBadge";

const tabs = [
  ["overview", "Overview"],
  ["findings", "Findings"],
  ["actions", "Actions"],
  ["corrective-actions", "Corrective Actions"],
  ["preventive-actions", "Preventive Actions"],
  ["containment", "Containment"],
  ["evidence", "Evidence"],
  ["verification", "Verification"],
  ["effectiveness", "Effectiveness"],
  ["closure-readiness", "Closure Readiness"],
  ["history", "History"],
] as const;

export function AuditCapaDetailHeader({ detail, activeTab }: { detail: AuditCapaDetail; activeTab: string }) {
  const capa = detail.capa;
  return (
    <AuditCard title={`${capa.capa_code} - ${capa.capa_title}`} subtitle="Audit CAPA package with Action Engine mapping foundation, verification, effectiveness, closure readiness, and immutable CAPA history.">
      <div className="flex flex-wrap gap-2">
        <AuditCapaStatusBadge value={capa.capa_status} />
        <AuditCapaPriorityBadge value={capa.priority} />
        <AuditCapaVerificationStatusBadge value={capa.verification_status} />
        <AuditCapaEffectivenessStatusBadge value={capa.effectiveness_status} />
        <AuditCapaClosureReadinessBadge value={capa.closure_readiness_status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AuditButton href={`/audit-compliance/capa/${capa.id}/edit`} variant="secondary">Edit</AuditButton>
        <AuditButton href={`/audit-compliance/capa/${capa.id}/actions`} variant="secondary">Add Action</AuditButton>
        <AuditButton href={`/audit-compliance/capa/${capa.id}/closure-readiness`} variant="secondary">Run Closure Readiness</AuditButton>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto border-t border-[var(--psm-line)] pt-4">
        {tabs.map(([key, label]) => <Link key={key} href={`/audit-compliance/capa/${capa.id}/${key === "overview" ? "" : key}`.replace(/\/$/, "")} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${activeTab === key ? "border-primary bg-primary/10 text-primary" : "border-[var(--psm-line)] text-[var(--psm-muted)]"}`}>{label}</Link>)}
      </div>
    </AuditCard>
  );
}
