import { TrainingCard } from '../../shared/TrainingUi';

export function TrainingRequirementStep() {
  return <TrainingCard title="1. Training Requirement" subtitle="Training title/code, category, source, mandatory/optional, safety-critical, PSM-critical, owner role, and notes are captured in the rule form." ><p className="text-sm text-[var(--psm-muted)]">If a Required Training Library exists later, these temporary matrix reference fields can be replaced by library links without rewriting evaluations.</p></TrainingCard>;
}
