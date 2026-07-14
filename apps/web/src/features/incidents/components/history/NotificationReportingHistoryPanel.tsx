import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function NotificationReportingHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Notification / Reporting History"><TimelineList rows={rows ?? []} empty="No notification or reporting history events were returned." /></TabPanel>; }
