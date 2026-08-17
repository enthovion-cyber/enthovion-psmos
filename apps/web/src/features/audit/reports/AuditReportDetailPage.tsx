"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReportDetail } from "../hooks/useAuditReportDetail";
import { useAuditReportMutations } from "../hooks/useAuditReportMutations";
import { AuditReportDetailHeader } from "./AuditReportDetailHeader";
import { ReportAccessTab } from "./tabs/ReportAccessTab";
import { ReportApprovalTab } from "./tabs/ReportApprovalTab";
import { ReportCapaTab } from "./tabs/ReportCapaTab";
import { ReportEvidenceTab } from "./tabs/ReportEvidenceTab";
import { ReportFilesTab } from "./tabs/ReportFilesTab";
import { ReportFindingsTab } from "./tabs/ReportFindingsTab";
import { ReportHistoryTab } from "./tabs/ReportHistoryTab";
import { ReportOverviewTab } from "./tabs/ReportOverviewTab";
import { ReportScoringTab } from "./tabs/ReportScoringTab";
import { ReportSectionsTab } from "./tabs/ReportSectionsTab";
import { ReportSnapshotTab } from "./tabs/ReportSnapshotTab";
import { ReportSourceTab } from "./tabs/ReportSourceTab";
import { ReportStandardsTab } from "./tabs/ReportStandardsTab";
import { ReportVersionsTab } from "./tabs/ReportVersionsTab";

export function AuditReportDetailPage({ section = "overview" }: { section?: string }) {
  const params = useParams<{ reportId: string }>();
  const reportId = params.reportId;
  const query = useAuditReportDetail(reportId);
  const mutations = useAuditReportMutations(reportId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  const action = (name: string, reason?: string) => mutations.transition.mutate({ action: name, data: reason ? { reason } : {} });
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={data.report.report_title} subtitle={`${data.report.report_code} / ${data.report.source_module ?? "Audit report"} / controlled final report and export lifecycle.`} actionHref="/audit-compliance/reports" actionLabel="Reports" />
    <AuditReportDetailHeader data={data} onAction={action} busy={mutations.transition.isPending} />
    {section === "overview" ? <ReportOverviewTab data={data} /> : null}
    {section === "source" ? <ReportSourceTab rows={data.source} /> : null}
    {section === "snapshot" ? <ReportSnapshotTab data={data.snapshot} /> : null}
    {section === "sections" ? <ReportSectionsTab rows={data.sections} /> : null}
    {section === "evidence" ? <ReportEvidenceTab rows={data.evidence} /> : null}
    {section === "findings" ? <ReportFindingsTab data={data.findings} /> : null}
    {section === "capa" ? <ReportCapaTab data={data.capa} /> : null}
    {section === "scoring" ? <ReportScoringTab data={data.scoring} /> : null}
    {section === "standards" ? <ReportStandardsTab data={data.standards} /> : null}
    {section === "approval" ? <ReportApprovalTab rows={data.approval} /> : null}
    {section === "files" ? <ReportFilesTab rows={data.files} /> : null}
    {section === "versions" ? <ReportVersionsTab rows={data.versions} /> : null}
    {section === "access" ? <ReportAccessTab access={data.access} downloads={data.downloads} /> : null}
    {section === "history" ? <ReportHistoryTab rows={data.history} /> : null}
  </div></AuditLayout>;
}
