import { ReportingSimplePanel } from './NotificationsRegulatoryPrimitives';
export function DeadlineEscalationPanel({ data }: { data: any }) { return <ReportingSimplePanel title="Deadline & Escalation Panel" data={data} empty="No reporting deadlines or acknowledgement due dates are tracked." />; }
