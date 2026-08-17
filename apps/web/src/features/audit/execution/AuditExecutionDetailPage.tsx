"use client";
import { useState } from "react";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState, formatAuditError } from "../shared/AuditUi";
import { useAuditExecutionDetail } from "../hooks/useAuditExecutionDetail";
import { useAuditExecutionMutations } from "../hooks/useAuditExecutionMutations";
import { AuditExecutionDetailHeader } from "./AuditExecutionDetailHeader";
import { ExecutionOverviewTab } from "./tabs/ExecutionOverviewTab";
import { ExecutionChecklistTab } from "./tabs/ExecutionChecklistTab";
import { ExecutionFieldFindingsTab } from "./tabs/ExecutionFieldFindingsTab";
import { ExecutionEvidenceTab } from "./tabs/ExecutionEvidenceTab";
import { ExecutionFieldNotesTab } from "./tabs/ExecutionFieldNotesTab";
import { ExecutionInterviewsTab } from "./tabs/ExecutionInterviewsTab";
import { ExecutionWalkthroughsTab } from "./tabs/ExecutionWalkthroughsTab";
import { ExecutionProgressTab } from "./tabs/ExecutionProgressTab";
import { ExecutionHistoryTab } from "./tabs/ExecutionHistoryTab";

const tabs = ["Overview", "Checklist", "Responses", "Field Notes", "Field Findings", "Evidence", "Interviews", "Walkthroughs", "Progress", "History"];

export function AuditExecutionDetailPage({ id }: { id: string }) {
  const [active, setActive] = useState("Overview");
  const query = useAuditExecutionDetail(id);
  const mutations = useAuditExecutionMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const action = (name: string) => {
    const reason = ["pause", "reopen", "cancel", "archive"].includes(name) ? window.prompt("Reason") : undefined;
    if (["pause", "reopen", "cancel", "archive"].includes(name) && !reason) return;
    mutations.action.mutate({ id, action: name, payload: reason ? { reason } : {} });
  };
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditExecutionDetailHeader execution={query.data.execution} onAction={action} busy={mutations.action.isPending} />
        {mutations.action.error ? <AuditCard><p className="text-sm text-danger">{formatAuditError(mutations.action.error)}</p></AuditCard> : null}
        <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActive(tab)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active === tab ? "bg-primary text-white" : "text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"}`}>{tab}</button>)}</div>
        {active === "Overview" ? <ExecutionOverviewTab detail={query.data} /> : active === "Checklist" || active === "Responses" ? <ExecutionChecklistTab detail={query.data} /> : active === "Field Notes" ? <ExecutionFieldNotesTab detail={query.data} /> : active === "Field Findings" ? <ExecutionFieldFindingsTab detail={query.data} /> : active === "Evidence" ? <ExecutionEvidenceTab detail={query.data} /> : active === "Interviews" ? <ExecutionInterviewsTab detail={query.data} /> : active === "Walkthroughs" ? <ExecutionWalkthroughsTab detail={query.data} /> : active === "Progress" ? <ExecutionProgressTab detail={query.data} /> : <ExecutionHistoryTab detail={query.data} />}
      </div>
    </AuditLayout>
  );
}
