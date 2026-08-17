import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function MocUpdateRequiredPanel({ rows = [] }: { rows?: PsiUnit[] | undefined }) {
  return <PsiCard title="MOC Update Required" subtitle="Hazard/design-basis changes flagged for controlled change foundation.">{rows.length ? <div className="space-y-2">{rows.map((unit) => <div key={unit.id} className="rounded-lg border border-warning/30 bg-warning/5 p-3 font-semibold">{unit.unit_code} - {unit.unit_name}</div>)}</div> : <PsiEmptyState title="No MOC update flags" message="No visible PSI unit currently requires an MOC update foundation." />}</PsiCard>;
}
