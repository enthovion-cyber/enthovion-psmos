import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function TeamChangeHistoryPanel({ rows }: { rows?: any[] }) { return <TabPanel title="Team Change History"><TimelineList rows={rows ?? []} empty="No investigation team history events found." /></TabPanel>; }
