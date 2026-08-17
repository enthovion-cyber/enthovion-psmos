import { FormSection, SelectField, TextField } from './section-fields';
export function SilRiskReductionSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="SIL / Risk Reduction" description="Target SIL, achieved RRF, achieved PFDavg, calculation method, and verification status.">
    <SelectField label="Target SIL" value={value.targetSil ?? value.target_sil} options={['SIL 1', 'SIL 2', 'SIL 3', 'SIL 4', 'Not Required', 'Not Determined']} onChange={(targetSil) => onChange({ targetSil })} />
    <TextField label="Achieved RRF" value={value.achievedRrf ?? value.achieved_rrf} onChange={(achievedRrf) => onChange({ achievedRrf })} />
    <TextField label="Achieved PFDavg" value={value.achievedPfdavg ?? value.achieved_pfdavg} onChange={(achievedPfdavg) => onChange({ achievedPfdavg })} />
    <TextField label="Calculation method" value={value.silCalculationMethod ?? value.sil_calculation_method} onChange={(silCalculationMethod) => onChange({ silCalculationMethod })} />
    <TextField label="Verification status" value={value.silVerificationStatus ?? value.sil_verification_status} onChange={(silVerificationStatus) => onChange({ silVerificationStatus })} />
  </FormSection>;
}
