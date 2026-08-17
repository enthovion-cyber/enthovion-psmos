import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemLookups } from '../../types/relief-system.types';
import { CheckboxField, SelectField, TextAreaField, TextField } from './ReliefSectionControls';

export function ReliefDeviceProtectionSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: ReliefSystemLookups | undefined; onChange: (patch: Record<string, unknown>) => void }) {
  return (
    <PsiCard title="3. Relief Device / Protection" subtitle="PSV/rupture disc/conservation vent/device link, set pressure, rated capacity, status, car seal, bypass, and MI synchronization reference.">
      <div className="grid gap-3 md:grid-cols-3">
        <TextField label="MI relief device ID" name="mi_relief_device_id" value={value.mi_relief_device_id} onChange={onChange} />
        <TextField label="Relief device tag" name="relief_device_tag" value={value.relief_device_tag} onChange={onChange} />
        <SelectField label="Relief device type" name="relief_device_type" value={value.relief_device_type} options={lookups?.reliefDeviceTypes ?? ['PSV','Rupture Disc','Conservation Vent','Breather Vent','Emergency Vent','Other']} onChange={onChange} />
        <TextField type="number" label="Set pressure" name="set_pressure" value={value.set_pressure} onChange={onChange} />
        <TextField label="Set pressure unit" name="set_pressure_unit" value={value.set_pressure_unit} onChange={onChange} />
        <TextField type="number" label="Rated capacity" name="rated_capacity" value={value.rated_capacity} onChange={onChange} />
        <TextField label="Rated capacity unit" name="rated_capacity_unit" value={value.rated_capacity_unit} onChange={onChange} />
        <TextField label="Device status" name="device_status" value={value.device_status} onChange={onChange} />
        <TextField label="Last test status" name="last_test_status" value={value.last_test_status} onChange={onChange} />
        <CheckboxField label="Bypass active" name="bypass_active" value={value.bypass_active} onChange={onChange} />
        <CheckboxField label="Car seal required" name="car_seal_required" value={value.car_seal_required} onChange={onChange} />
        <CheckboxField label="Device not linked in MI" name="device_not_linked" value={value.device_not_linked} onChange={onChange} />
        <TextAreaField label="Protection notes" name="protection_notes" value={value.protection_notes} onChange={onChange} />
      </div>
    </PsiCard>
  );
}
