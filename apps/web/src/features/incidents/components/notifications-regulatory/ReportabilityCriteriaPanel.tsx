import { ReportingSimplePanel } from './NotificationsRegulatoryPrimitives';
export function ReportabilityCriteriaPanel({ rows }: { rows: any[] }) { return <ReportingSimplePanel title="Reportability Criteria / Trigger Panel" data={{ rows }} empty="No backend criteria were returned." />; }
