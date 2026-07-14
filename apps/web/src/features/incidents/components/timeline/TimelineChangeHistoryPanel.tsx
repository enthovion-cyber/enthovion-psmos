import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function TimelineChangeHistoryPanel({ rows }: any) { return <TabPanel title="Timeline Change History Panel"><TimelineList rows={rows ?? []} empty="No timeline history events were returned." /></TabPanel>; }
