"use client";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditFindingDetail } from "../hooks/useAuditFindingDetail";
import { useAuditFindingMutations } from "../hooks/useAuditFindingMutations";
import { AuditFindingConfirmDialog, ReasonAction } from "./AuditFindingConfirmDialog";
import { AuditFindingDetailHeader } from "./AuditFindingDetailHeader";
import { AuditFindingDuplicateWarningPanel } from "./AuditFindingDuplicateWarningPanel";
import { FindingCapaFoundationTab } from "./tabs/FindingCapaFoundationTab";
import { FindingClassificationTab } from "./tabs/FindingClassificationTab";
import { FindingEvidenceTab } from "./tabs/FindingEvidenceTab";
import { FindingHistoryTab } from "./tabs/FindingHistoryTab";
import { FindingLinkedRecordsTab } from "./tabs/FindingLinkedRecordsTab";
import { FindingOverviewTab } from "./tabs/FindingOverviewTab";
import { FindingOwnershipTab } from "./tabs/FindingOwnershipTab";
import { FindingReviewTab } from "./tabs/FindingReviewTab";
import { FindingSourceTab } from "./tabs/FindingSourceTab";
import { FindingStandardsModulesTab } from "./tabs/FindingStandardsModulesTab";

export function AuditFindingDetailPage({ findingId, activeTab = "overview" }: { findingId: string; activeTab?: string }) {
  const query = useAuditFindingDetail(findingId);
  const mutations = useAuditFindingMutations(findingId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const detail = query.data;
  const action = (name: string, payload: Record<string, unknown>) => mutations.action.mutate({ action: name, payload });
  const confirmDisabled = detail.readiness.blockers[0];
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditFindingDetailHeader detail={detail} activeTab={activeTab} />
        <AuditCard title="Lifecycle actions" subtitle="Backend-controlled status changes with exact disabled reasons and audit/history events.">
          <div className="grid gap-3 xl:grid-cols-5">
            <AuditFindingConfirmDialog {...(confirmDisabled ? { disabledReason: confirmDisabled } : {})} onConfirm={(payload) => action("confirm", payload)} />
            <AuditButton disabled={detail.finding.finding_status !== "Confirmed"} title={detail.finding.finding_status !== "Confirmed" ? "Ready For CAPA requires confirmed status." : "Mark Ready For CAPA"} onClick={() => action("mark-ready-for-capa", {})}>Ready For CAPA</AuditButton>
            <AuditButton variant="secondary" onClick={() => action("submit-review", {})}>Submit Review</AuditButton>
            <ReasonAction label="Reject" action="reject" danger onSubmit={action} />
            <ReasonAction label="Archive" action="archive" danger onSubmit={action} />
            <ReasonAction label="Reopen" action="reopen" onSubmit={action} />
          </div>
        </AuditCard>
        {activeTab === "overview" ? <><FindingOverviewTab detail={detail} /><AuditFindingDuplicateWarningPanel detail={detail} /></> : null}
        {activeTab === "source" ? <FindingSourceTab detail={detail} /> : null}
        {activeTab === "classification" ? <FindingClassificationTab detail={detail} /> : null}
        {activeTab === "standards-modules" ? <FindingStandardsModulesTab detail={detail} /> : null}
        {activeTab === "evidence" ? <FindingEvidenceTab detail={detail} /> : null}
        {activeTab === "ownership" ? <FindingOwnershipTab detail={detail} /> : null}
        {activeTab === "linked-records" ? <FindingLinkedRecordsTab detail={detail} /> : null}
        {activeTab === "review" ? <FindingReviewTab detail={detail} /> : null}
        {activeTab === "capa-foundation" ? <FindingCapaFoundationTab detail={detail} /> : null}
        {activeTab === "history" ? <FindingHistoryTab detail={detail} /> : null}
      </div>
    </AuditLayout>
  );
}
