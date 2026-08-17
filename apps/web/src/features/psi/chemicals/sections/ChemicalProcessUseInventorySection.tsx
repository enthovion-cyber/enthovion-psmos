import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ChemicalProcessUseInventorySection({ value, lookups, onChange, forcedUnitId }: { value: Record<string, any>; lookups?: Record<string, string[]> | undefined; onChange: (patch: Record<string, any>) => void; forcedUnitId?: string | undefined }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ [event.target.name]: event.target.value });
  return (
    <PsiCard title="2. Process Use / Inventory" subtitle="Inventory and service changes can trigger MOC suggestion and PSI completeness impact.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="unit_id" label="Process unit ID" value={forcedUnitId ?? value.unit_id} onChange={change} disabled={Boolean(forcedUnitId)} required />
        <Field name="area_id" label="Area" value={value.area_id} onChange={change} />
        <Field name="equipment_id" label="Equipment / storage vessel" value={value.equipment_id} onChange={change} />
        <Field name="process_use" label="Process use" value={value.process_use} onChange={change} required />
        <Select name="use_type" label="Use type" value={value.use_type} options={lookups?.chemicalUseTypes ?? []} onChange={change} />
        <Field name="normal_inventory" label="Normal inventory" type="number" value={value.normal_inventory} onChange={change} />
        <Field name="max_intended_inventory" label="Maximum intended inventory" type="number" value={value.max_intended_inventory} onChange={change} required />
        <Field name="inventory_unit" label="Inventory unit" value={value.inventory_unit} onChange={change} required />
        <Field name="normal_temperature" label="Normal operating temperature" value={value.normal_temperature} onChange={change} />
        <Field name="normal_pressure" label="Normal operating pressure" value={value.normal_pressure} onChange={change} />
        <Field name="storage_temperature" label="Storage temperature" value={value.storage_temperature} onChange={change} />
        <Field name="storage_pressure" label="Storage pressure" value={value.storage_pressure} onChange={change} />
        <Field name="storage_condition" label="Storage condition" value={value.storage_condition} onChange={change} />
        <Field name="transfer_method" label="Transfer method" value={value.transfer_method} onChange={change} />
        <Field name="use_frequency" label="Frequency of use" value={value.use_frequency} onChange={change} />
        <Field name="operating_mode" label="Batch / continuous use" value={value.operating_mode} onChange={change} />
      </div>
    </PsiCard>
  );
}

function Field({ label, required, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}{required ? ' *' : ''}<input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 disabled:opacity-70" /></label>; }
function Select({ label, options, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<select {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Select</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></label>; }
