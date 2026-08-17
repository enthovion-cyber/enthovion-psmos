import { FormSection, TextArea, TextField } from './section-fields';
export function CauseEffectSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Cause & Effect" description="Inputs, trip logic, output action, permissives, overrides, and reset philosophy.">
    <TextArea label="Input causes" value={value.inputCauses ?? value.input_causes} onChange={(inputCauses) => onChange({ inputCauses })} />
    <TextField label="Trip setpoint" value={value.tripSetpoint ?? value.trip_setpoint} onChange={(tripSetpoint) => onChange({ tripSetpoint })} />
    <TextArea label="Logic description" value={value.logicDescription ?? value.logic_description} onChange={(logicDescription) => onChange({ logicDescription })} />
    <TextArea label="Final action" value={value.finalAction ?? value.final_action} onChange={(finalAction) => onChange({ finalAction })} />
    <TextArea label="Reset requirements" value={value.resetRequirements ?? value.reset_requirements} onChange={(resetRequirements) => onChange({ resetRequirements })} />
  </FormSection>;
}
