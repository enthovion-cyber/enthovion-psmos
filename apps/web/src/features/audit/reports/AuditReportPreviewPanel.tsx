import { AuditCard, AuditEmptyState } from "../shared/AuditUi";
export function AuditReportPreviewPanel({ preview }: { preview?: Record<string, unknown> }) {
  return <AuditCard title="Report Preview Panel" subtitle="Preview is generated from the backend snapshot/manifest, not client-side fake content.">{preview && Object.keys(preview).length ? <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(preview, null, 2)}</pre> : <AuditEmptyState title="No preview" message="Generate or preview this report to show backend snapshot content." />}</AuditCard>;
}
