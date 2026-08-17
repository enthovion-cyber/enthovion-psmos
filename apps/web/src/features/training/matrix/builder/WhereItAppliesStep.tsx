import { TrainingCard } from '../../shared/TrainingUi';

export function WhereItAppliesStep() {
  return <TrainingCard title="3. Where It Applies" subtitle="Company, site, unit, area, equipment, process system, hazardous area, and PSI hazard context." ><p className="text-sm text-[var(--psm-muted)]">The backend rejects cross-site application outside the user’s allowed scope.</p></TrainingCard>;
}
