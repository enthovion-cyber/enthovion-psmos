import { RowsPanel } from "../AuditReportPanels";
export function ReportFilesTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Generated Files / Secure Downloads" rows={rows} empty="No generated file metadata exists yet." />; }
