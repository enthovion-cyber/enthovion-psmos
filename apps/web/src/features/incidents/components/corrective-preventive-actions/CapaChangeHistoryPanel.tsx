import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function CapaChangeHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="CAPA Change History Panel"><TimelineList rows={rows ?? []} empty="No CAPA history events yet." columns /></TabPanel>; }
