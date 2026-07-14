import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function LinkedRecordsChangeHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Linked Records Change History Panel"><TimelineList rows={rows ?? []} empty="No linked-record history events yet." columns /></TabPanel>; }
