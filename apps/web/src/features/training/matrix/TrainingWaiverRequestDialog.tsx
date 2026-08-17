import { TrainingCard } from '../shared/TrainingUi';

export function TrainingWaiverRequestDialog() {
  return <TrainingCard title="Waiver Request" subtitle="Waivers require gap, worker, training requirement, reason, risk justification, compensating control, expiry, approver, and approval status."><p className="text-sm text-[var(--psm-muted)]">PTW/MOC/PSSR blocker waiver approval is permission-controlled and audited. Approved waivers do not delete gaps.</p></TrainingCard>;
}
