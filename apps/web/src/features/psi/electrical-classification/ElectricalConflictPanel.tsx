import { PsiCard } from '../shared/PsiUi';
import { ElectricalConflictBadge } from '../components/shared/ElectricalConflictBadge';
import type { ElectricalConflict } from '../types/electrical-classification.types';

export function ElectricalConflictPanel({ conflicts }: { conflicts: ElectricalConflict[] }) {
  return <PsiCard title="Conflicts / Rating Validation" subtitle="Backend-generated conflict checks detect drawing gaps, group/T-class mismatches, non-Ex equipment in hazardous areas, ventilation missing basis, MOC/PSSR blockers, and override-required items."><div className="grid gap-2">{conflicts.length ? conflicts.map((conflict) => <div key={conflict.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{conflict.conflict_type}</p><ElectricalConflictBadge value={conflict.conflict_status} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{conflict.message}</p>{conflict.override_required ? <p className="mt-1 text-sm font-semibold text-warning">Override required</p> : null}</div>) : <p className="text-sm text-[var(--psm-muted)]">No active electrical classification conflicts were returned by the backend.</p>}</div></PsiCard>;
}
