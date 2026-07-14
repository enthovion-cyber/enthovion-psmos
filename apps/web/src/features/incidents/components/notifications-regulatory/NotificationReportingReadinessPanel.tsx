import { TabPanel } from '../shared/IncidentTabPrimitives';
import { ReportingReadinessContent } from './NotificationsRegulatoryPrimitives';
export function NotificationReportingReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="Readiness / Missing Data Panel"><ReportingReadinessContent readiness={readiness} /></TabPanel>; }
