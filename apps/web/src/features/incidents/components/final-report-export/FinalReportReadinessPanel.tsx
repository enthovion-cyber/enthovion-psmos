import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function FinalReportReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="Final Report Readiness Panel"><ReadinessContent readiness={readiness} /></TabPanel>; }
