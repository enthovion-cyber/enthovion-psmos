import type { PsiCompletenessGap } from '../types/psi-completeness.types';
import { PsiCard } from '../shared/PsiUi';

export function PsiMocRequiredPanel({ rows = [] }: { rows?: PsiCompletenessGap[] }) {
  return <PsiCard title="MOC Required PSI Updates" subtitle="Source changes and conflicts requiring formal PSI update through MOC."><ul className="space-y-2 text-sm">{rows.length ? rows.map((gap) => <li key={gap.id} className="rounded-lg border border-warning/25 bg-warning/10 p-3"><strong>{gap.gap_title}</strong><p className="text-[var(--psm-muted)]">{gap.recommended_action ?? gap.reason}</p></li>) : <li className="text-[var(--psm-muted)]">No MOC-required completeness gaps in this scope.</li>}</ul></PsiCard>;
}
