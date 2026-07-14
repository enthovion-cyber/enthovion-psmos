import { ActionInfoPanel } from './ImmediateActionsPrimitives';
export function IsolationShutdownPermitControlPanel({ data }: any) { return <ActionInfoPanel title="Isolation / Shutdown / Permit Control" rows={data?.rows} empty="No isolation, shutdown, or permit controls captured." />; }
