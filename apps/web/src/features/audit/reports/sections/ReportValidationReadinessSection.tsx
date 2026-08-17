import { AuditEmptyState } from "../../shared/AuditUi";
export function ReportValidationReadinessSection({ preview }: { preview?: Record<string, unknown> | null }) {
  if (!preview) return <AuditEmptyState title="No preview generated" message="Use Generate Preview to ask the backend for a source snapshot manifest before creating the report." />;
  return <pre className="max-h-72 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(preview, null, 2)}</pre>;
}
