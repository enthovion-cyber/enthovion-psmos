import { CheckboxField, FormSection, TextArea, TextField } from './section-fields';
export function BypassFoundationSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Bypass / Inhibit / Override Foundation" description="Required approval, compensating measures, duration limits, alarm handling, and startup impact.">
    <CheckboxField label="Bypass allowed" checked={value.bypassAllowed ?? value.bypass_allowed} onChange={(bypassAllowed) => onChange({ bypassAllowed })} />
    <TextField label="Maximum bypass duration" value={value.maxBypassDuration ?? value.max_bypass_duration} onChange={(maxBypassDuration) => onChange({ maxBypassDuration })} />
    <TextArea label="Compensating measures" value={value.compensatingMeasures ?? value.compensating_measures} onChange={(compensatingMeasures) => onChange({ compensatingMeasures })} />
    <TextArea label="Approval requirements" value={value.bypassApprovalRequirements ?? value.bypass_approval_requirements} onChange={(bypassApprovalRequirements) => onChange({ bypassApprovalRequirements })} />
  </FormSection>;
}
