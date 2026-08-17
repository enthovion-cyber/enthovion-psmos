import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';
import { PsiCriticalGapBadge } from '../shared/PsiCriticalGapBadge';

export function MissingCriticalPsiPanel({ rows = [] }: { rows?: PsiUnit[] | undefined }) {
  return (
    <PsiCard title="Missing Critical PSI" subtitle="Critical gaps that can block PSSR/readiness.">
      {rows.length ? <div className="space-y-3">{rows.map((unit) => <UnitAlert key={unit.id} unit={unit} />)}</div> : <PsiEmptyState title="No critical PSI gaps" message="Backend completeness checks have not found critical gaps for visible units." />}
    </PsiCard>
  );
}

function UnitAlert({ unit }: { unit: PsiUnit }) {
  return <div className="rounded-lg border border-danger/25 bg-danger/5 p-3"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{unit.unit_code} - {unit.unit_name}</p><PsiCriticalGapBadge count={unit.critical_gap_count} blocker={unit.pssr_blocker} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{unit.site?.name ?? unit.site_id}</p></div>;
}
