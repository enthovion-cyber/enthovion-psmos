import { TrainingCard } from '../shared/TrainingUi';

export function AssessmentGradingPanel({ attempt }: { attempt?: Record<string, unknown> }) {
  return <TrainingCard title="Grading"><p className="text-sm text-[var(--psm-muted)]">Backend grading status: {String(attempt?.attempt_status ?? 'Not started')}. Manual grading is required for scenario, practical, observation, and upload questions.</p></TrainingCard>;
}
