import { RowsPanel } from "../AuditReportPanels";
export function ReportApprovalTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Review & Approval Links" rows={rows} empty="No Review & Approval package links are stored for this report." />; }
