import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function BarrierChangeHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Barrier Change History"><TimelineList rows={rows ?? []} empty="No barrier history events yet." /></TabPanel>; }
