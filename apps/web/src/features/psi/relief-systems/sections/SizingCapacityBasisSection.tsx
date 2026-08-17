import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemLookups } from '../../types/relief-system.types';
import { SelectField, TextAreaField, TextField } from './ReliefSectionControls';

export function SizingCapacityBasisSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: ReliefSystemLookups | undefined; onChange: (patch: Record<string, unknown>) => void }) {
  return (
    <PsiCard title="5. Sizing / Capacity Basis" subtitle="Required load, rated capacity, capacity margin, set pressure relationship, calculation status, methodology, references, and design margin.">
      <div className="grid gap-3 md:grid-cols-3">
        <TextField type="number" label="Required relief rate" name="required_relief_rate" value={value.required_relief_rate} onChange={onChange} />
        <TextField label="Required relief rate unit" name="required_relief_rate_unit" value={value.required_relief_rate_unit} onChange={onChange} />
        <TextField type="number" label="Rated capacity" name="rated_capacity" value={value.rated_capacity} onChange={onChange} />
        <TextField label="Rated capacity unit" name="rated_capacity_unit" value={value.rated_capacity_unit} onChange={onChange} />
        <TextField type="number" label="Capacity margin percent" name="capacity_margin_percent" value={value.capacity_margin_percent} onChange={onChange} />
        <TextField type="number" label="Set pressure" name="set_pressure" value={value.set_pressure} onChange={onChange} />
        <TextField type="number" label="MAWP" name="mawp" value={value.mawp} onChange={onChange} />
        <TextField type="number" label="Relieving pressure" name="relieving_pressure" value={value.relieving_pressure} onChange={onChange} />
        <SelectField label="Calculation status" name="calculation_status" value={value.calculation_status ?? 'Not Reviewed'} options={lookups?.calculationStatuses ?? ['Complete','Missing','Needs Update','Not Required','Not Reviewed']} onChange={onChange} />
        <TextField label="Calculation document ID" name="calculation_document_id" value={value.calculation_document_id} onChange={onChange} />
        <TextField label="Methodology / code basis" name="methodology_basis" value={value.methodology_basis} onChange={onChange} />
        <TextField label="Engineer / reviewer ID" name="sizing_engineer_id" value={value.sizing_engineer_id} onChange={onChange} />
        <TextAreaField label="Sizing assumptions, limitations, and calculation notes" name="sizing_notes" value={value.sizing_notes} onChange={onChange} />
      </div>
    </PsiCard>
  );
}
