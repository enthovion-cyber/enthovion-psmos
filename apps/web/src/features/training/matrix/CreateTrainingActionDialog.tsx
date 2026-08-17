import { TrainingCard } from '../shared/TrainingUi';

export function CreateTrainingActionDialog() {
  return <TrainingCard title="Create Training Action" subtitle="Creates/links action-engine work from a matrix gap without making action closure equal gap closure."><p className="text-sm text-[var(--psm-muted)]">The backend records the action link and keeps the gap open until evidence or waiver verification is complete.</p></TrainingCard>;
}
