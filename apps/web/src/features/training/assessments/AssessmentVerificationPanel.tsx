import { TrainingCard } from '../shared/TrainingUi';

export function AssessmentVerificationPanel({ result }: { result?: Record<string, unknown> }) {
  return <TrainingCard title="Verification"><p className="text-sm text-[var(--psm-muted)]">Verification status: {String(result?.verification_status ?? 'Pending')}. Safety-critical verification updates matrix and competency evidence only after backend approval.</p></TrainingCard>;
}
