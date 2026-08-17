import { FormSection, TextArea, TextField } from './section-fields';
export function HazardScenarioSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Hazard Scenario" description="Protected event, initiating causes, consequence, safe state, and demand basis.">
    <TextArea label="Hazard scenario" value={value.hazardScenario ?? value.hazard_scenario} onChange={(hazardScenario) => onChange({ hazardScenario })} />
    <TextArea label="Initiating causes" value={value.initiatingCauses ?? value.initiating_causes} onChange={(initiatingCauses) => onChange({ initiatingCauses })} />
    <TextArea label="Consequence prevented" value={value.consequencePrevented ?? value.consequence_prevented} onChange={(consequencePrevented) => onChange({ consequencePrevented })} />
    <TextField label="Safe state" value={value.safeState ?? value.safe_state} onChange={(safeState) => onChange({ safeState })} />
    <TextField label="Demand mode" value={value.demandMode ?? value.demand_mode} onChange={(demandMode) => onChange({ demandMode })} />
  </FormSection>;
}
