import { FormSection, TextArea, TextField } from './section-fields';
export function LopaSilLinkSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="LOPA / SIL Links" description="Traceability to LOPA scenarios, SIL target, risk gap, and approved calculation basis.">
    <TextField label="LOPA scenario ID" value={value.lopaScenarioId ?? value.lopa_scenario_id} onChange={(lopaScenarioId) => onChange({ lopaScenarioId })} />
    <TextField label="LOPA scenario number" value={value.lopaScenarioNumber ?? value.lopa_scenario_number} onChange={(lopaScenarioNumber) => onChange({ lopaScenarioNumber })} />
    <TextField label="Risk calculation version" value={value.riskCalculationVersion ?? value.risk_calculation_version} onChange={(riskCalculationVersion) => onChange({ riskCalculationVersion })} />
    <TextField label="Required RRF" value={value.requiredRrf ?? value.required_rrf} onChange={(requiredRrf) => onChange({ requiredRrf })} />
    <TextField label="Required PFDavg" value={value.requiredPfdavg ?? value.required_pfdavg} onChange={(requiredPfdavg) => onChange({ requiredPfdavg })} />
    <TextArea label="SIL basis notes" value={value.silBasisNotes ?? value.sil_basis_notes} onChange={(silBasisNotes) => onChange({ silBasisNotes })} />
  </FormSection>;
}
