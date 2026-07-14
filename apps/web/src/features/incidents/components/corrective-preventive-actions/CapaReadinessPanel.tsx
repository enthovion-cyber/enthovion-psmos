import { TabPanel } from '../shared/IncidentTabPrimitives';
import { CapaReadinessContent } from './CapaPanelPrimitives';
export function CapaReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="CAPA Readiness / Missing Data Panel"><CapaReadinessContent readiness={readiness} /></TabPanel>; }
