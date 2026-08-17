import { CheckboxField, FormSection, TextArea, TextField } from './section-fields';
export function ProtectedEquipmentSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Protected Equipment / Scope" description="Equipment, process section, protection scope, and startup criticality.">
    <TextField label="Protected equipment ID" value={value.protectedEquipmentId ?? value.protected_equipment_id} onChange={(protectedEquipmentId) => onChange({ protectedEquipmentId })} />
    <TextField label="Protected equipment tag" value={value.protectedEquipmentTag ?? value.protected_equipment_tag} onChange={(protectedEquipmentTag) => onChange({ protectedEquipmentTag })} />
    <TextField label="Process service" value={value.processService ?? value.process_service} onChange={(processService) => onChange({ processService })} />
    <TextArea label="Protection scope" value={value.protectionScope ?? value.protection_scope} onChange={(protectionScope) => onChange({ protectionScope })} />
    <CheckboxField label="Startup blocked if impaired" checked={value.startupBlocked ?? value.startup_blocked} onChange={(startupBlocked) => onChange({ startupBlocked })} />
  </FormSection>;
}
