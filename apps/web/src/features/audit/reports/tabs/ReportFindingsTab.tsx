import { JsonPanel } from "../AuditReportPanels";
export function ReportFindingsTab({ data }: { data: Record<string, unknown> }) { return <JsonPanel title="Findings Snapshot" data={data} />; }
