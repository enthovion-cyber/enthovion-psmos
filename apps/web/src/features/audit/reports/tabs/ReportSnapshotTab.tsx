import { JsonPanel } from "../AuditReportPanels";
export function ReportSnapshotTab({ data }: { data: Record<string, unknown> }) { return <JsonPanel title="Immutable Source Snapshot" data={data} />; }
