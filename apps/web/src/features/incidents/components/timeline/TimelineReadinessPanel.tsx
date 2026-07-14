import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function TimelineReadinessPanel({ readiness }: any) { return <TabPanel title="Timeline Readiness / Missing Data Panel"><ReadinessContent readiness={readiness} /></TabPanel>; }
