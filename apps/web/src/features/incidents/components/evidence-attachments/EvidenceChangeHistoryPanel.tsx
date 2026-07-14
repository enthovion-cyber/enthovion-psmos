import { TimelineList, TabPanel } from '../shared/IncidentTabPrimitives';

export function EvidenceChangeHistoryPanel({ rows }: { rows?: any[] }) {
  return <TabPanel title="Evidence Change History"><TimelineList rows={rows ?? []} empty="No evidence history events found." /></TabPanel>;
}
