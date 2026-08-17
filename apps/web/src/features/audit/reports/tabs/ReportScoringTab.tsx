import { JsonPanel } from "../AuditReportPanels";
export function ReportScoringTab({ data }: { data: Record<string, unknown> }) { return <JsonPanel title="Compliance Scoring Snapshot" data={data} />; }
