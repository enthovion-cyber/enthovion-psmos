import { TabPanel } from '../shared/IncidentTabPrimitives';
import { BarrierReadinessContent } from './BarrierPanelPrimitives';
export function BarrierReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="Barrier Readiness / Missing Data"><BarrierReadinessContent readiness={readiness} /></TabPanel>; }
