import { RowCards } from './TimelinePrimitives';
import { TabPanel } from '../shared/IncidentTabPrimitives';
export function EvidenceMappedTimelinePanel({ rows }: any) { return <TabPanel title="Evidence-Mapped Timeline Panel"><RowCards rows={rows ?? []} empty="No timeline events are mapped to evidence yet." /></TabPanel>; }
