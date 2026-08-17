import { AuditCard } from "../shared/AuditUi";
export function AuditReportDownloadDialog({ disabledReason }: { disabledReason?: string }) { return <AuditCard title="Download Report">{disabledReason ?? "Download is served by backend and logged in access/download events."}</AuditCard>; }
