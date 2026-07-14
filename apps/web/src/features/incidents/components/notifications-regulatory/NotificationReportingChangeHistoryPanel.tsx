import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function NotificationReportingChangeHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Change History Panel"><TimelineList rows={rows ?? []} empty="No notification/reporting history events yet." columns /></TabPanel>; }
