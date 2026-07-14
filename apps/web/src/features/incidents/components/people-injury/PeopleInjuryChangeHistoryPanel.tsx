import { TimelineList, TabPanel } from '../shared/IncidentTabPrimitives';
export function PeopleInjuryChangeHistoryPanel({ rows }: any) { return <TabPanel title="People / Injury Change History Panel"><TimelineList rows={rows ?? []} empty="No people/injury/exposure history events were returned." /></TabPanel>; }
