import { TabPanel } from '../shared/IncidentTabPrimitives';
import { BarrierReadinessContent } from './BarrierPanelPrimitives';
export function BarrierAnalysisReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="Barrier Analysis Readiness"><BarrierReadinessContent readiness={readiness} /></TabPanel>; }
