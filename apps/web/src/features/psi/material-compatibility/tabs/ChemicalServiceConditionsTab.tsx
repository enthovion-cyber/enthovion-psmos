import { Field, FieldGrid } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function ChemicalServiceConditionsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.serviceConditions ?? {};
  return <PsiCard title="Chemical / Service Conditions" subtitle="Chemical identity, stream, concentration, temperature, pressure, pH, exposure and corrosive service details."><FieldGrid>{['chemical_name','cas_number','chemical_role','stream_name','concentration_min','concentration_max','temperature_min','temperature_max','pressure_min','pressure_max','ph_min','ph_max','exposure_type','water_present','oxygen_present','chloride_present','h2s_sour_service','acid_service','caustic_service','upset_conditions'].map((key) => <Field key={key} label={key.replaceAll('_', ' ')} value={String(row[key] ?? '') || null} warn={row[key] === null || row[key] === undefined || row[key] === ''} />)}</FieldGrid></PsiCard>;
}

