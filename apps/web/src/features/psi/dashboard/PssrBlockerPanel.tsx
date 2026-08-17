import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function PssrBlockerPanel({ rows = [] }: { rows?: PsiUnit[] | undefined }) {
  return <PsiCard title="PSSR Blockers From PSI" subtitle="Missing critical PSI that can block startup authorization.">{rows.length ? <div className="space-y-2">{rows.map((unit) => <div key={unit.id} className="rounded-lg border border-danger/30 bg-danger/5 p-3 font-semibold">{unit.unit_code} - {unit.unit_name}</div>)}</div> : <PsiEmptyState title="No PSSR blockers" message="No visible PSI completeness result is currently blocking PSSR." />}</PsiCard>;
}
