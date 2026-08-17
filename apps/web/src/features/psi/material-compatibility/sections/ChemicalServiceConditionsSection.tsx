import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityLookups } from '../../types/material-compatibility.types';

export function ChemicalServiceConditionsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: MaterialCompatibilityLookups; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="2. Chemical / Service Conditions" subtitle="Chemical identity, CAS, mixture, concentration, temperature, pressure, pH, water/oxygen/chloride/H2S, exposure mode, cleaning chemicals, upset conditions, and corrosive service.">
      <FieldGrid>
        <TextInput label="Chemical name" value={value.chemical_name} onChange={(chemical_name) => onChange({ chemical_name })} />
        <TextInput label="CAS number" value={value.cas_number} onChange={(cas_number) => onChange({ cas_number })} />
        <TextInput label="Chemical role" value={value.chemical_role} onChange={(chemical_role) => onChange({ chemical_role })} />
        <TextInput label="Mixture / stream name" value={value.stream_name} onChange={(stream_name) => onChange({ stream_name })} />
        <TextInput label="Concentration min" type="number" value={value.concentration_min} onChange={(concentration_min) => onChange({ concentration_min })} />
        <TextInput label="Concentration max" type="number" value={value.concentration_max} onChange={(concentration_max) => onChange({ concentration_max })} />
        <TextInput label="Concentration unit" value={value.concentration_unit} onChange={(concentration_unit) => onChange({ concentration_unit })} />
        <TextInput label="Temperature min" type="number" value={value.temperature_min} onChange={(temperature_min) => onChange({ temperature_min })} />
        <TextInput label="Temperature max" type="number" value={value.temperature_max} onChange={(temperature_max) => onChange({ temperature_max })} />
        <TextInput label="Temperature unit" value={value.temperature_unit} onChange={(temperature_unit) => onChange({ temperature_unit })} />
        <TextInput label="Pressure min" type="number" value={value.pressure_min} onChange={(pressure_min) => onChange({ pressure_min })} />
        <TextInput label="Pressure max" type="number" value={value.pressure_max} onChange={(pressure_max) => onChange({ pressure_max })} />
        <TextInput label="pH min" type="number" value={value.ph_min} onChange={(ph_min) => onChange({ ph_min })} />
        <TextInput label="pH max" type="number" value={value.ph_max} onChange={(ph_max) => onChange({ ph_max })} />
        <SelectInput label="Exposure type" value={value.exposure_type} options={lookups.exposureTypes} onChange={(exposure_type) => onChange({ exposure_type })} />
        <Toggle label="Water present" checked={value.water_present} onChange={(water_present) => onChange({ water_present })} />
        <Toggle label="Oxygen present" checked={value.oxygen_present} onChange={(oxygen_present) => onChange({ oxygen_present })} />
        <Toggle label="Chloride present" checked={value.chloride_present} onChange={(chloride_present) => onChange({ chloride_present })} />
        <Toggle label="H2S / sour service" checked={value.h2s_sour_service} onChange={(h2s_sour_service) => onChange({ h2s_sour_service })} />
        <Toggle label="Acid service" checked={value.acid_service} onChange={(acid_service) => onChange({ acid_service })} />
        <Toggle label="Caustic service" checked={value.caustic_service} onChange={(caustic_service) => onChange({ caustic_service })} />
        <Toggle label="Cleaning / flushing chemical" checked={value.cleaning_flushing_service} onChange={(cleaning_flushing_service) => onChange({ cleaning_flushing_service })} />
        <TextArea label="Upset / abnormal conditions" value={value.upset_conditions} onChange={(upset_conditions) => onChange({ upset_conditions })} />
      </FieldGrid>
    </PsiCard>
  );
}

