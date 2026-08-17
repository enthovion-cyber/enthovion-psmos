import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemLookups } from '../../types/relief-system.types';
import { CheckboxField, SelectField, TextAreaField, TextField } from './ReliefSectionControls';

export function DischargeDestinationSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: ReliefSystemLookups | undefined; onChange: (patch: Record<string, unknown>) => void }) {
  return (
    <PsiCard title="6. Discharge / Destination" subtitle="Flare/header/scrubber/atmosphere routing, destination capacity, environmental basis, backpressure, knock-out drum, and restricted-release controls.">
      <div className="grid gap-3 md:grid-cols-3">
        <SelectField required label="Relief destination" name="relief_destination" value={value.relief_destination} options={lookups?.reliefDestinationTypes ?? ['Flare','Atmosphere','Scrubber','Closed Drain','Knockout Drum','Vent Header','Tank','Other']} onChange={onChange} />
        <TextField label="Destination detail" name="destination_detail" value={value.destination_detail} onChange={onChange} />
        <TextField label="Flare / vent header" name="flare_header" value={value.flare_header} onChange={onChange} />
        <TextField type="number" label="Backpressure" name="backpressure" value={value.backpressure} onChange={onChange} />
        <TextField label="Backpressure unit" name="backpressure_unit" value={value.backpressure_unit} onChange={onChange} />
        <TextField label="Disposal system capacity" name="disposal_system_capacity" value={value.disposal_system_capacity} onChange={onChange} />
        <CheckboxField label="Atmospheric release allowed" name="atmospheric_release_allowed" value={value.atmospheric_release_allowed} onChange={onChange} />
        <CheckboxField label="Toxic / flammable discharge concern" name="toxic_or_flammable_discharge" value={value.toxic_or_flammable_discharge} onChange={onChange} />
        <CheckboxField label="Environmental review required" name="environmental_review_required" value={value.environmental_review_required} onChange={onChange} />
        <TextAreaField label="Destination basis and environmental / community impact notes" name="destination_notes" value={value.destination_notes} onChange={onChange} />
      </div>
    </PsiCard>
  );
}
