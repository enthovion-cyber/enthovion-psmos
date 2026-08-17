import { AuditCard } from "../shared/AuditUi";
export function AuditReportRegenerateDialog({ disabledReason }: { disabledReason?: string }) { return <AuditCard title="Regenerate Report">{disabledReason ?? "Regeneration creates a new version; official files are preserved."}</AuditCard>; }
