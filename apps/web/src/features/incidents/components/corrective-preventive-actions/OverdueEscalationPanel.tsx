import { CapaSimplePanel } from './CapaPanelPrimitives';
export function OverdueEscalationPanel({ data }: { data: any }) { return <CapaSimplePanel title="Overdue / Escalation Panel" data={data} empty="No overdue or escalated CAPA items." />; }
