import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function ImmediateActionsChangeHistoryPanel({ rows }: { rows?: any[] }) { return <TabPanel title="Immediate Actions Change History"><TimelineList rows={rows ?? []} empty="No immediate action history events found." /></TabPanel>; }
