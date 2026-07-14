import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';
export function AssetChemicalReadinessPanel({ readiness }: any) { return <TabPanel title="Asset / Chemical Readiness / Missing Data Panel"><ReadinessContent readiness={readiness} /></TabPanel>; }
