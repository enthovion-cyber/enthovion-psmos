import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function LessonsReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="Lessons Readiness / Missing Data"><ReadinessContent readiness={readiness} /></TabPanel>; }
