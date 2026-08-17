import { TrainingCard } from '../../shared/TrainingUi';
export function ApprovalRuleValidationSection({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const reqs = value.validationRequirements ?? value.validation_requirements_json ?? [];
  return <TrainingCard title="Validation Requirements" subtitle="Backend validates source existence, scope, submittable status, evidence, current version, blockers, stale state, and e-signature."><textarea className="min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={JSON.stringify(reqs, null, 2)} onChange={(e) => { try { onChange({ ...value, validationRequirements: JSON.parse(e.target.value || '[]') }); } catch { onChange(value); } }} /></TrainingCard>;
}
