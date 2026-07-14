import { ReportingSimplePanel } from './NotificationsRegulatoryPrimitives';
export function ExternalStakeholderNotificationPanel({ data }: { data: any }) { return <ReportingSimplePanel title="External Stakeholder Notification Panel" data={data} empty="No external stakeholders are configured for this incident." />; }
