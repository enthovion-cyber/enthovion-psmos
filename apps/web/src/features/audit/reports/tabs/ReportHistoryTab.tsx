import { RowsPanel } from "../AuditReportPanels";
export function ReportHistoryTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Immutable Report History" rows={rows} empty="No report history events are recorded yet." />; }
