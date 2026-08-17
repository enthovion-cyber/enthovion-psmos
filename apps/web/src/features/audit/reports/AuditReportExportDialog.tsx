import { AuditCard } from "../shared/AuditUi";
export function AuditReportExportDialog({ disabledReason }: { disabledReason?: string }) { return <AuditCard title="Export Report">{disabledReason ?? "Export creates a backend job and history event."}</AuditCard>; }
