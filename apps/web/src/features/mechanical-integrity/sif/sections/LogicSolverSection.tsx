import { FormSection, TextArea, TextField } from './section-fields';
export function LogicSolverSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Logic Solver" description="PLC/SIS solver, program reference, diagnostics, and proof-test basis.">
    <TextField label="Logic solver tag" value={value.logicSolverTag ?? value.logic_solver_tag} onChange={(logicSolverTag) => onChange({ logicSolverTag })} />
    <TextArea label="Logic solver notes" value={value.logicSolverNotes ?? value.logic_solver_notes} onChange={(logicSolverNotes) => onChange({ logicSolverNotes })} />
  </FormSection>;
}
