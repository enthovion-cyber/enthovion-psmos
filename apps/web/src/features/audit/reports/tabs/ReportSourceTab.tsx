import { RowsPanel } from "../AuditReportPanels";
export function ReportSourceTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Report Source Links" rows={rows} empty="No source links are stored for this report." />; }
