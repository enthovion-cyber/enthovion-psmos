import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function PeopleInjuryReadinessPanel({ readiness }: any) { return <TabPanel title="People / Injury Readiness / Missing Data Panel"><ReadinessContent readiness={readiness} /></TabPanel>; }
