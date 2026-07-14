import { TabPanel } from '../shared/IncidentTabPrimitives';
import { NotificationTable } from './NotificationsRegulatoryPrimitives';
export function InternalNotificationsRegister(props: any) { return <TabPanel title="Internal Notifications Register"><NotificationTable {...props} /></TabPanel>; }
