import { FormSection, SelectField, TextField } from './section-fields';
export function ArchitectureVotingSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Architecture / Voting" description="Sensor, logic solver, final element voting, diagnostics, proof-test coverage, and common cause factors.">
    <SelectField label="Architecture" value={value.architecture} options={['1oo1', '1oo2', '2oo2', '2oo3', 'Other']} onChange={(architecture) => onChange({ architecture })} />
    <TextField label="Sensor voting" value={value.sensorVoting ?? value.sensor_voting} onChange={(sensorVoting) => onChange({ sensorVoting })} />
    <TextField label="Logic solver voting" value={value.logicSolverVoting ?? value.logic_solver_voting} onChange={(logicSolverVoting) => onChange({ logicSolverVoting })} />
    <TextField label="Final element voting" value={value.finalElementVoting ?? value.final_element_voting} onChange={(finalElementVoting) => onChange({ finalElementVoting })} />
    <TextField label="Diagnostic coverage" value={value.diagnosticCoverage ?? value.diagnostic_coverage} onChange={(diagnosticCoverage) => onChange({ diagnosticCoverage })} />
    <TextField label="Common cause factor" value={value.commonCauseFactor ?? value.common_cause_factor} onChange={(commonCauseFactor) => onChange({ commonCauseFactor })} />
  </FormSection>;
}
