import { ActionInfoPanel } from './ImmediateActionsPrimitives';
export function EmergencyResponseActionsPanel({ data }: any) { return <ActionInfoPanel title="Emergency Response Actions" rows={data?.rows} empty="No emergency response actions captured." />; }
