import { RowsPanel } from "../AuditReportPanels";
export function ReportEvidenceTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Report Evidence / Appendices" rows={rows} empty="No evidence items are mapped to this report." />; }
