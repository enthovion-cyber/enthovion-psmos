import { ReportingSimplePanel } from './NotificationsRegulatoryPrimitives';
export function ManagementLegalInsurancePanel({ data }: { data: any }) { return <ReportingSimplePanel title="Management / Legal / Insurance Notification Panel" data={{ status: data?.status, rows: [data] }} empty="No management/legal/insurance recommendation was returned." />; }
