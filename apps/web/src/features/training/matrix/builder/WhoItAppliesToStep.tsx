import { TrainingCard } from '../../shared/TrainingUi';

export function WhoItAppliesToStep() {
  return <TrainingCard title="2. Who It Applies To" subtitle="Worker type, employer type, contractor company, department, job role, competency profile, PTW role candidate, safety-critical role, and specific worker filters." ><p className="text-sm text-[var(--psm-muted)]">Backend preview validates affected workers inside the user’s company/site scope.</p></TrainingCard>;
}
