import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function FinalReportChangeHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Final Report Change History Panel"><TimelineList rows={rows ?? []} empty="No final report/export history events yet." columns /></TabPanel>; }
