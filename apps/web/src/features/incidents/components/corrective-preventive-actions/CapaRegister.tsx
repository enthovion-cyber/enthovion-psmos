import { TabPanel } from '../shared/IncidentTabPrimitives';
import { CapaRegisterTable } from './CapaPanelPrimitives';
export function CapaRegister(props: any) { return <TabPanel title="Corrective / Preventive Actions Register"><CapaRegisterTable {...props} /></TabPanel>; }
