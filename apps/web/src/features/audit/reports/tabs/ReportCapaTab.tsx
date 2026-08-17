import { JsonPanel } from "../AuditReportPanels";
export function ReportCapaTab({ data }: { data: Record<string, unknown> }) { return <JsonPanel title="CAPA Snapshot" data={data} />; }
