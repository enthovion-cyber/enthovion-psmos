"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditMetricCard } from "../../shared/AuditUi";
import { AuditCapaActionTable } from "../AuditCapaActionTable";
import { AuditCapaClosureReadinessBadge } from "../../shared/AuditCapaClosureReadinessBadge";
import { AuditCapaEffectivenessStatusBadge } from "../../shared/AuditCapaEffectivenessStatusBadge";
import { AuditCapaVerificationStatusBadge } from "../../shared/AuditCapaVerificationStatusBadge";

export function CapaOverviewTab({ detail }: { detail: AuditCapaDetail }) {
  const calc = detail.calculated ?? {};
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AuditMetricCard label="Actions" value={detail.actions.length} tone="info" />
        <AuditMetricCard label="Open actions" value={calc.openActions ?? 0} tone={(calc.openActions ?? 0) ? "warn" : "good"} />
        <AuditMetricCard label="Overdue actions" value={calc.overdueActions ?? 0} tone={(calc.overdueActions ?? 0) ? "danger" : "good"} />
        <AuditMetricCard label="Missing evidence" value={calc.missingEvidence?.length ?? 0} tone={(calc.missingEvidence?.length ?? 0) ? "warn" : "good"} />
      </div>
      <AuditCard title="CAPA readiness / blockers" subtitle="Backend-calculated status from linked findings, actions, evidence, verification, effectiveness checks, and closure rules.">
        <div className="flex flex-wrap gap-2">
          <AuditCapaVerificationStatusBadge value={detail.capa.verification_status} />
          <AuditCapaEffectivenessStatusBadge value={detail.capa.effectiveness_status} />
          <AuditCapaClosureReadinessBadge value={detail.capa.closure_readiness_status} />
        </div>
        {calc.missingItems?.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-danger">{calc.missingItems.map((item: string) => <li key={item}>{item}</li>)}</ul> : <p className="mt-4 text-sm text-emerald-600">No backend readiness blockers are currently reported.</p>}
      </AuditCard>
      <AuditCard title="Action Engine mapped actions" subtitle="Corrective, preventive, containment, and systemic action rows remain tied to the CAPA package and finding source.">
        <AuditCapaActionTable rows={detail.actions.slice(0, 8)} />
      </AuditCard>
    </div>
  );
}
