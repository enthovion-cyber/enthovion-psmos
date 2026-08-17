import { TrainingCard } from '../shared/TrainingUi';

export function TrainingMatrixRunDialog() {
  return <TrainingCard title="Run Matrix Evaluation" subtitle="The backend supports company, site, unit, area, worker, job role, rule, and category scopes. Large runs can later move to a queue if configured." ><p className="text-sm text-[var(--psm-muted)]">Use the Run Evaluation button on the grid or worker view for the current allowed scope.</p></TrainingCard>;
}
