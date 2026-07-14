import { ActionInfoPanel } from './ImmediateActionsPrimitives';
export function SpillReleaseFireResponsePanel({ data }: any) { return <ActionInfoPanel title="Spill / Release / Fire Response" rows={data?.rows} empty="No spill, release, or fire response actions captured." />; }
