"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReports, useAuditReportView } from "../hooks/useAuditReports";
import { AuditReportFilters } from "./AuditReportFilters";
import { AuditReportMobileCards } from "./AuditReportMobileCards";
import { AuditReportTable } from "./AuditReportTable";
import { AuditReportsSummaryCards } from "./AuditReportsSummaryCards";

export function AuditReportRegisterPage({ view, title = "Audit Report Register", subtitle = "Server-side audit report register with scoped filters, status, readiness, stale state, source linkage, and export lifecycle." }: { view?: string; title?: string; subtitle?: string }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const query = view ? useAuditReportView(view, filters) : useAuditReports(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={title} subtitle={subtitle} actionHref="/audit-compliance/reports/generate" actionLabel="Generate Report" />
    {query.data.summary ? <AuditReportsSummaryCards summary={query.data.summary} /> : null}
    <AuditReportFilters onChange={setFilters} />
    <AuditCard title={title} action={<AuditButton href="/audit-compliance/reports/templates" variant="secondary">Templates</AuditButton>}>{query.data.rows.length ? <><div className="hidden md:block"><AuditReportTable rows={query.data.rows} /></div><AuditReportMobileCards rows={query.data.rows} /></> : <AuditEmptyState title="No reports found" message="No backend audit report records match this view and filter set." />}</AuditCard>
  </div></AuditLayout>;
}
