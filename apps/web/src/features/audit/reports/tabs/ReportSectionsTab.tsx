import { RowsPanel } from "../AuditReportPanels";
export function ReportSectionsTab({ rows }: { rows: Record<string, unknown>[] }) { return <RowsPanel title="Report Section Builder / Checklist" rows={rows} empty="No report sections are configured." />; }
