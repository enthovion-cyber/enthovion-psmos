import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function LessonsChangeHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Lessons Change History"><TimelineList rows={rows ?? []} empty="No lessons history events were returned." /></TabPanel>; }
