import { AuditCard } from "../shared/AuditUi";
export function AuditReportArchiveDialog({ disabledReason }: { disabledReason?: string }) { return <AuditCard title="Archive Report">{disabledReason ?? "Archive requires a backend reason and audit/history event."}</AuditCard>; }
