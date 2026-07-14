import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function ImmediateActionsReadinessPanel({ readiness }: { readiness?: any }) { return <TabPanel title="Immediate Actions Readiness / Missing Data"><ReadinessContent readiness={readiness} /></TabPanel>; }
