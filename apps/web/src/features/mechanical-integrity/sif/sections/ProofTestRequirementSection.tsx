import { CheckboxField, FormSection, SelectField, TextField } from './section-fields';
export function ProofTestRequirementSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Proof Test Requirements" description="Backend scheduler uses this requirement to create due, overdue, and occurrence records.">
    <SelectField label="Test type" value={value.testType ?? value.test_type} options={['Proof Test', 'Functional Test', 'Stroke Test', 'Partial Stroke Test', 'Alarm Test', 'Interlock Test']} onChange={(testType) => onChange({ testType })} />
    <TextField label="Interval value" value={value.intervalValue ?? value.interval_value} onChange={(intervalValue) => onChange({ intervalValue })} />
    <SelectField label="Interval unit" value={value.intervalUnit ?? value.interval_unit} options={['days', 'weeks', 'months', 'years']} onChange={(intervalUnit) => onChange({ intervalUnit })} />
    <TextField label="Next test due date" type="date" value={value.nextTestDueDate ?? value.next_test_due_date} onChange={(nextTestDueDate) => onChange({ nextTestDueDate })} />
    <CheckboxField label="Shutdown required" checked={value.shutdownRequired ?? value.shutdown_required} onChange={(shutdownRequired) => onChange({ shutdownRequired })} />
    <CheckboxField label="Bypass required for testing" checked={value.bypassRequired ?? value.bypass_required} onChange={(bypassRequired) => onChange({ bypassRequired })} />
  </FormSection>;
}
