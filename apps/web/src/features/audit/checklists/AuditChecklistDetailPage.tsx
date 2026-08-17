"use client";
import Link from "next/link";
import { useState } from "react";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditChecklistDetail } from "../hooks/useAuditChecklistDetail";
import { useAuditChecklistMutations } from "../hooks/useAuditChecklistMutations";
import { AuditChecklistDetailHeader } from "./AuditChecklistDetailHeader";
import { ChecklistOverviewTab } from "./tabs/ChecklistOverviewTab";
import { ChecklistSectionsTab } from "./tabs/ChecklistSectionsTab";
import { ChecklistItemsTab } from "./tabs/ChecklistItemsTab";
import { ChecklistStandardsTab } from "./tabs/ChecklistStandardsTab";
import { ChecklistModulesTab } from "./tabs/ChecklistModulesTab";
import { ChecklistApplicabilityTab } from "./tabs/ChecklistApplicabilityTab";
import { ChecklistAssignmentsTab } from "./tabs/ChecklistAssignmentsTab";
import { ChecklistVersionHistoryTab } from "./tabs/ChecklistVersionHistoryTab";
import { ChecklistReviewTab } from "./tabs/ChecklistReviewTab";
import { ChecklistHistoryTab } from "./tabs/ChecklistHistoryTab";
const tabs = [
  ["overview", "Overview"],
  ["sections", "Sections"],
  ["items", "Items / Questions"],
  ["standards", "Standards / Regulations"],
  ["modules", "Modules Covered"],
  ["applicability", "Applicability"],
  ["assignments", "Assigned Programs / Plans"],
  ["version-history", "Version History"],
  ["execution-preview", "Future Execution Preview"],
  ["review", "Review"],
  ["history", "History"],
];
export function AuditChecklistDetailPage({
  id,
  tab = "overview",
}: {
  id: string;
  tab?: string;
}) {
  const q = useAuditChecklistDetail(id),
    m = useAuditChecklistMutations();
  const [error, setError] = useState("");
  if (q.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (q.error || !q.data)
    return (
      <AuditLayout>
        <AuditErrorState message={q.error} />
      </AuditLayout>
    );
  const d = q.data,
    action = async (a: string, p: Record<string, unknown> = {}) => {
      try {
        setError("");
        if (a === "calculate-readiness") {
          await import("../services/audit-checklist.service").then((x) =>
            x.auditChecklistService.readiness(id),
          );
          await q.refetch();
        } else await m.action.mutateAsync({ id, action: a, payload: p });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    };
  const content =
    tab === "sections" ? (
      <ChecklistSectionsTab detail={d} />
    ) : tab === "items" ? (
      <ChecklistItemsTab detail={d} />
    ) : tab === "standards" ? (
      <ChecklistStandardsTab detail={d} />
    ) : tab === "modules" ? (
      <ChecklistModulesTab detail={d} />
    ) : tab === "applicability" ? (
      <ChecklistApplicabilityTab detail={d} />
    ) : tab === "assignments" ? (
      <ChecklistAssignmentsTab detail={d} />
    ) : tab === "version-history" ? (
      <ChecklistVersionHistoryTab detail={d} />
    ) : tab === "review" ? (
      <ChecklistReviewTab detail={d} />
    ) : tab === "history" ? (
      <ChecklistHistoryTab detail={d} />
    ) : tab === "execution-preview" ? (
      <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-[var(--psm-muted)]">
        This phase is not implemented yet. No fake execution data is shown.
      </div>
    ) : (
      <ChecklistOverviewTab detail={d} />
    );
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditChecklistDetailHeader
          template={d.template}
          onAction={action}
          busy={m.action.isPending}
        />
        {error ? (
          <p className="rounded-xl bg-danger/10 p-4 text-danger">{error}</p>
        ) : null}
        <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
          {tabs.map(([k, l]) => (
            <Link
              key={k}
              href={`/audit-compliance/checklists/templates/${id}/${k === "overview" ? "" : k}`.replace(
                /\/$/,
                "",
              )}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${tab === k ? "bg-primary text-white" : "text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"}`}
            >
              {l}
            </Link>
          ))}
        </nav>
        {content}
      </div>
    </AuditLayout>
  );
}
