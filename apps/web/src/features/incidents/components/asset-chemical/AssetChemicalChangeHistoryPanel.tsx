import { TimelineList, TabPanel } from '../shared/IncidentTabPrimitives';
export function AssetChemicalChangeHistoryPanel({ rows }: any) { return <TabPanel title="Asset / Chemical Change History Panel"><TimelineList rows={rows ?? []} empty="No asset/equipment/chemical history events were returned." /></TabPanel>; }
