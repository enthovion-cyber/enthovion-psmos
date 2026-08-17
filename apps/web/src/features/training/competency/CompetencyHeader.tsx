import { TrainingButton } from '../shared/TrainingUi';

export function CompetencyHeader({ title = 'Roles & Competency Profiles', subtitle = 'Role-based competency standards, worker assignments, evidence gaps, and safety-critical blockers.', actions }: { title?: string; subtitle?: string; actions?: React.ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Training & Competency</p><h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1><p className="mt-1 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p></div><div className="flex flex-wrap gap-2">{actions ?? <><TrainingButton href="/training-competency/roles-competency-profiles/profiles/new">New Profile</TrainingButton><TrainingButton href="/training-competency/roles-competency-profiles/competencies" variant="secondary">Competency Library</TrainingButton></>}</div></div>;
}
