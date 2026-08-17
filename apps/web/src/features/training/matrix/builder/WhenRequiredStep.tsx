import { TrainingCard } from '../../shared/TrainingUi';

export function WhenRequiredStep() {
  return <TrainingCard title="4. When It Is Required" subtitle="Onboarding, site access, unit assignment, PTW role authorization, MOC implementation, PSSR/startup, SOP revision, incident lesson, HAZOP recommendation, PSI change, one-time, recurring, due date rule, grace period, and expiry warning." ><p className="text-sm text-[var(--psm-muted)]">Due dates are backend-calculated during matrix evaluation.</p></TrainingCard>;
}
