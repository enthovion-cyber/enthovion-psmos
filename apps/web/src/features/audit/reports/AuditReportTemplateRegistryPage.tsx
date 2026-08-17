"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditReportTemplateStatusBadge } from "../shared/AuditReportTemplateStatusBadge";
import { useAuditReportTemplates } from "../hooks/useAuditReportTemplates";
export function AuditReportTemplateRegistryPage() {
  const query = useAuditReportTemplates();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Audit Report Templates" subtitle="Backend governed report templates, sections, formats, redaction rules, versioning, and approval status." actionHref="/audit-compliance/reports/templates/new" actionLabel="New Template" /><AuditCard title="Template Registry">{query.data.rows.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{query.data.rows.map((row) => <a key={String(row.id)} href={`/audit-compliance/reports/templates/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex justify-between gap-3"><b>{String(row.template_name ?? row.template_code ?? "Template")}</b><AuditReportTemplateStatusBadge status={String(row.template_status ?? "Draft")} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.template_type ?? "Audit Report")} / {String(row.default_format ?? "PDF")}</p></a>)}</div> : <AuditEmptyState title="No templates" message="No backend report templates are configured for this scope." />}</AuditCard></div></AuditLayout>;
}
