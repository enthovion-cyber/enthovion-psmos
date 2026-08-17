"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditCapaDetail } from "../hooks/useAuditCapaDetail";
import { AuditCapaDetailHeader } from "./AuditCapaDetailHeader";
import { CapaActionsTab } from "./tabs/CapaActionsTab";
import { CapaClosureReadinessTab } from "./tabs/CapaClosureReadinessTab";
import { CapaContainmentTab } from "./tabs/CapaContainmentTab";
import { CapaEffectivenessTab } from "./tabs/CapaEffectivenessTab";
import { CapaEvidenceTab } from "./tabs/CapaEvidenceTab";
import { CapaFindingsTab } from "./tabs/CapaFindingsTab";
import { CapaHistoryTab } from "./tabs/CapaHistoryTab";
import { CapaOverviewTab } from "./tabs/CapaOverviewTab";
import { CapaVerificationTab } from "./tabs/CapaVerificationTab";

export function AuditCapaDetailPage({ capaId, activeTab = "overview" }: { capaId: string; activeTab?: string }) {
  const query = useAuditCapaDetail(capaId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const detail = query.data;
  const tab = activeTab === "findings" ? <CapaFindingsTab detail={detail} />
    : activeTab === "actions" ? <CapaActionsTab detail={detail} />
    : activeTab === "corrective-actions" ? <CapaActionsTab detail={detail} filterType="Corrective Action" />
    : activeTab === "preventive-actions" ? <CapaActionsTab detail={detail} filterType="Preventive Action" />
    : activeTab === "containment" ? <CapaContainmentTab detail={detail} />
    : activeTab === "evidence" ? <CapaEvidenceTab detail={detail} />
    : activeTab === "verification" ? <CapaVerificationTab detail={detail} />
    : activeTab === "effectiveness" ? <CapaEffectivenessTab detail={detail} />
    : activeTab === "closure-readiness" ? <CapaClosureReadinessTab detail={detail} />
    : activeTab === "history" ? <CapaHistoryTab detail={detail} />
    : <CapaOverviewTab detail={detail} />;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit CAPA / Action Integration" subtitle="Source-linked CAPA package detail." />
        <AuditCapaDetailHeader detail={detail} activeTab={activeTab} />
        {tab}
      </div>
    </AuditLayout>
  );
}
