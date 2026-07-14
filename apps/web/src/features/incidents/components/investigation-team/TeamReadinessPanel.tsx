import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function TeamReadinessPanel({ readiness }: { readiness?: any }) { return <TabPanel title="Team Readiness / Missing Data"><ReadinessContent readiness={readiness} /></TabPanel>; }
