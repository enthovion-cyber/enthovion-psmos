"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditPlanDetail } from "../hooks/useAuditPlanDetail";
import { useAuditPlanMutations } from "../hooks/useAuditPlanMutations";
import { AuditPlanDetailHeader } from "./AuditPlanDetailHeader";
import { PlanOverviewTab } from "./tabs/PlanOverviewTab";
import { PlanProgramLinkTab } from "./tabs/PlanProgramLinkTab";
import { PlanScopeTab } from "./tabs/PlanScopeTab";
import { PlanStandardsTab } from "./tabs/PlanStandardsTab";
import { PlanModulesTab } from "./tabs/PlanModulesTab";
import { PlanTeamTab } from "./tabs/PlanTeamTab";
import { PlanScheduleTab } from "./tabs/PlanScheduleTab";
import { PlanReadinessTab } from "./tabs/PlanReadinessTab";
import { PlanConflictsTab } from "./tabs/PlanConflictsTab";
import { PlanHistoryTab } from "./tabs/PlanHistoryTab";
const tabs = [
  ["overview", "Overview"],
  ["program-link", "Program Link"],
  ["scope", "Scope"],
  ["standards", "Standards / Regulations"],
  ["modules", "Modules Covered"],
  ["team", "Audit Team"],
  ["schedule", "Schedule"],
  ["readiness", "Readiness"],
  ["conflicts", "Conflicts"],
  ["checklist", "Future Checklist"],
  ["execution", "Future Execution"],
  ["history", "History"],
];
export function AuditPlanDetailPage({
  planId,
  tab = "overview",
}: {
  planId: string;
  tab?: string;
}) {
  const query = useAuditPlanDetail(planId);
  const mutations = useAuditPlanMutations();
  const [error, setError] = useState("");
  const path = usePathname();
  if (query.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (query.error || !query.data)
    return (
      <AuditLayout>
        <AuditErrorState message={query.error} />
      </AuditLayout>
    );
  const detail = query.data;
  const action = async (a: string, payload: Record<string, unknown> = {}) => {
    try {
      setError("");
      await mutations.action.mutateAsync({ id: planId, action: a, payload });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  };
  const content =
    tab === "program-link" ? (
      <PlanProgramLinkTab detail={detail} />
    ) : tab === "scope" ? (
      <PlanScopeTab detail={detail} />
    ) : tab === "standards" ? (
      <PlanStandardsTab detail={detail} />
    ) : tab === "modules" ? (
      <PlanModulesTab detail={detail} />
    ) : tab === "team" ? (
      <PlanTeamTab detail={detail} />
    ) : tab === "schedule" ? (
      <PlanScheduleTab detail={detail} />
    ) : tab === "readiness" ? (
      <PlanReadinessTab detail={detail} />
    ) : tab === "conflicts" ? (
      <PlanConflictsTab detail={detail} />
    ) : tab === "history" ? (
      <PlanHistoryTab detail={detail} />
    ) : tab === "checklist" || tab === "execution" ? (
      <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center">
        This integration point is reserved for a future phase. No fake execution
        data is shown.
      </div>
    ) : (
      <PlanOverviewTab detail={detail} />
    );
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditPlanDetailHeader
          plan={detail.plan}
          onAction={action}
          busy={mutations.action.isPending}
        />
        {error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
            {error}
          </div>
        ) : null}
        <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
          {tabs.map(([key, label]) => (
            <Link
              key={key}
              href={`/audit-compliance/plans/${planId}/${key === "overview" ? "" : key}`.replace(
                /\/$/,
                "",
              )}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${tab === key || path.endsWith("/" + key) ? "bg-primary text-white" : "text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {content}
      </div>
    </AuditLayout>
  );
}
