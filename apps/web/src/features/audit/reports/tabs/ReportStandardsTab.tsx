import { JsonPanel } from "../AuditReportPanels";
export function ReportStandardsTab({ data }: { data: Record<string, unknown> }) { return <JsonPanel title="Standards Traceability Snapshot" data={data} />; }
