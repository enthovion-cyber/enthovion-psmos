import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function UserActivityAccessHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="User Activity / Access History"><TimelineList rows={rows ?? []} empty="No access-history events were captured or you do not have access-history permission." /></TabPanel>; }
