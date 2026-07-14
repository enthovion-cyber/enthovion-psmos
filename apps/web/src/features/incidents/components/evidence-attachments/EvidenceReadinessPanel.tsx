import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';

export function EvidenceReadinessPanel({ readiness }: { readiness?: any }) {
  return <TabPanel title="Evidence Readiness / Missing Data"><ReadinessContent readiness={readiness} /></TabPanel>;
}
