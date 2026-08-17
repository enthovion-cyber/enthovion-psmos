import { PsiCard } from '../../shared/PsiUi';
import { CheckboxField, TextAreaField, TextField } from './ReliefSectionControls';

export function ProtectedEquipmentSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, unknown>) => void }) {
  return (
    <PsiCard title="2. Protected Equipment" subtitle="Equipment Registry relationship, protected item role, design pressure basis, isolation, and relief path.">
      <div className="grid gap-3 md:grid-cols-3">
        <TextField required label="Protected equipment ID" name="protected_equipment_id" value={value.protected_equipment_id} onChange={onChange} />
        <TextField required label="Protected equipment tag" name="protected_equipment_tag" value={value.protected_equipment_tag} onChange={onChange} />
        <TextField required label="Protected equipment name" name="protected_equipment_name" value={value.protected_equipment_name} onChange={onChange} />
        <TextField label="Equipment type" name="equipment_type" value={value.equipment_type} onChange={onChange} />
        <TextField label="Equipment criticality" name="equipment_criticality" value={value.equipment_criticality ?? 'Medium'} onChange={onChange} />
        <TextField label="Design basis ID" name="equipment_design_basis_id" value={value.equipment_design_basis_id} onChange={onChange} />
        <TextField type="number" label="MAWP" name="mawp" value={value.mawp} onChange={onChange} />
        <TextField label="MAWP unit" name="mawp_unit" value={value.mawp_unit} onChange={onChange} />
        <TextField type="number" label="Design pressure" name="design_pressure" value={value.design_pressure} onChange={onChange} />
        <CheckboxField label="Safety-critical protected item" name="safety_critical" value={value.safety_critical} onChange={onChange} />
        <CheckboxField label="PSM-critical protected item" name="psm_critical" value={value.psm_critical} onChange={onChange} />
        <TextField label="Isolation status" name="isolation_status" value={value.isolation_status} onChange={onChange} />
        <TextAreaField label="Relief path description" name="relief_path_description" value={value.relief_path_description} onChange={onChange} />
      </div>
    </PsiCard>
  );
}
