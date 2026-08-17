"use client";
import { AuditLayout } from "../AuditLayout";
import type { ReactNode } from "react";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditMappingDetail } from "../hooks/useAuditMappingDetail";
import { AuditMappingDetailHeader } from "./AuditMappingDetailHeader";
import { MappingOverviewTab } from "./tabs/MappingOverviewTab";
import { MappingSourceTab } from "./tabs/MappingSourceTab";
import { MappingLinkedRecordsTab } from "./tabs/MappingLinkedRecordsTab";
import { MappingCoverageTab } from "./tabs/MappingCoverageTab";
import { MappingEvidenceTab } from "./tabs/MappingEvidenceTab";
import { MappingFindingsTab } from "./tabs/MappingFindingsTab";
import { MappingCapaTab } from "./tabs/MappingCapaTab";
import { MappingScoringTab } from "./tabs/MappingScoringTab";
import { MappingTraceabilityTab } from "./tabs/MappingTraceabilityTab";
import { MappingHistoryTab } from "./tabs/MappingHistoryTab";

export function AuditMappingDetailPage({ mappingId, tab = "overview" }: { mappingId: string; tab?: string }) {
  const query = useAuditMappingDetail(mappingId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const detail = query.data;
  const tabs: Record<string, ReactNode> = {
    overview: <MappingOverviewTab detail={detail} />,
    source: <MappingSourceTab detail={detail} />,
    "linked-records": <MappingLinkedRecordsTab detail={detail} />,
    coverage: <MappingCoverageTab detail={detail} />,
    evidence: <MappingEvidenceTab detail={detail} />,
    findings: <MappingFindingsTab detail={detail} />,
    capa: <MappingCapaTab detail={detail} />,
    scoring: <MappingScoringTab detail={detail} />,
    traceability: <MappingTraceabilityTab detail={detail} />,
    history: <MappingHistoryTab detail={detail} />,
  };
  return <AuditLayout><div className="space-y-5"><AuditMappingDetailHeader detail={detail} />{tabs[tab] ?? tabs.overview}</div></AuditLayout>;
}
