import { ActionInfoPanel } from './ImmediateActionsPrimitives';
export function FirstAidMedicalImmediateResponsePanel({ data }: any) { return <ActionInfoPanel title="First Aid / Medical Immediate Response" rows={data?.rows} empty="No first aid or medical immediate response actions captured." />; }
