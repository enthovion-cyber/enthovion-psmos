import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function CapaActionHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="CAPA / Action History"><TimelineList rows={rows ?? []} empty="No CAPA or Universal Action history events were returned." /></TabPanel>; }
