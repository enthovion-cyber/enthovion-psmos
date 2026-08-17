import { RowsPanel } from "../AuditReportPanels";
export function ReportVersionsTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Report Version History" rows={rows} empty="No report versions have been created yet." />; }
