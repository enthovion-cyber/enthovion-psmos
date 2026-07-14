import { TabPanel } from '../shared/IncidentTabPrimitives';
import { BarrierTable } from './BarrierPanelPrimitives';
export function BarrierSafeguardRegister(props: any) { return <TabPanel title="Barrier / Safeguard Register"><BarrierTable rows={props.rows ?? []} {...props} /></TabPanel>; }
