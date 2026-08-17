import { PsiButton, PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemLookups } from '../../types/relief-system.types';
import { CheckboxField, SelectField, TextAreaField, TextField } from './ReliefSectionControls';

export function ReliefScenariosSection({ scenarios, lookups, onChange }: { scenarios: Record<string, any>[]; lookups?: ReliefSystemLookups | undefined; onChange: (rows: Record<string, any>[]) => void }) {
  const update = (index: number, patch: Record<string, unknown>) => onChange(scenarios.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <PsiCard title="4. Relief Scenarios" subtitle="Blocked outlet, fire exposure, thermal expansion, runaway, utility failure, reflux failure, control failure, tube rupture, external fire, and governing-case selection.">
      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div key={index} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <div className="grid gap-3 md:grid-cols-3">
              <SelectField required label="Scenario type" name="scenario_type" value={scenario.scenario_type} options={lookups?.reliefScenarioTypes ?? ['Blocked Outlet','External Fire','Thermal Expansion','Runaway Reaction','Cooling Failure','Utility Failure','Tube Rupture','Control Valve Failure','Other']} onChange={(patch) => update(index, patch)} />
              <TextField type="number" label="Required relief rate" name="required_relief_rate" value={scenario.required_relief_rate} onChange={(patch) => update(index, patch)} />
              <TextField label="Required rate unit" name="required_relief_rate_unit" value={scenario.required_relief_rate_unit} onChange={(patch) => update(index, patch)} />
              <TextField type="number" label="Relieving pressure" name="relieving_pressure" value={scenario.relieving_pressure} onChange={(patch) => update(index, patch)} />
              <TextField type="number" label="Relieving temperature" name="relieving_temperature" value={scenario.relieving_temperature} onChange={(patch) => update(index, patch)} />
              <CheckboxField label="Governing case" name="governing_case" value={scenario.governing_case} onChange={(patch) => update(index, patch)} />
              <TextAreaField label="Scenario description and assumptions" name="scenario_description" value={scenario.scenario_description} onChange={(patch) => update(index, patch)} />
            </div>
          </div>
        ))}
        <PsiButton variant="secondary" onClick={() => onChange([...scenarios, { scenario_type: '', scenario_description: '', governing_case: false }])}>Add Scenario</PsiButton>
      </div>
    </PsiCard>
  );
}
