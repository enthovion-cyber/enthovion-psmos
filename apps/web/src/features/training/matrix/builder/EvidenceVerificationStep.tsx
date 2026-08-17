import { TrainingCard } from '../../shared/TrainingUi';

export function EvidenceVerificationStep() {
  return <TrainingCard title="5. Evidence / Verification" subtitle="Attendance, certificate, assessment, quiz, SOP acknowledgement, practical assessment, supervisor/HSE sign-off, external document, LMS import, and manual verification." ><p className="text-sm text-[var(--psm-muted)]">No evidence source means Missing Evidence, never fake completion.</p></TrainingCard>;
}
