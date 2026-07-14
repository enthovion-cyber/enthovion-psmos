import { RowCards } from './TimelinePrimitives';
import { TabPanel } from '../shared/IncidentTabPrimitives';
export function TimelineGapsConflictsPanel({ data }: any) { return <TabPanel title="Timeline Gaps / Conflicts Panel"><RowCards rows={data?.rows ?? []} empty="No timeline gaps or conflicts returned by backend." /></TabPanel>; }
