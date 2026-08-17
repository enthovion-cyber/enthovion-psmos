import type { PsiCompletenessEvaluation } from '../types/psi-completeness.types';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function MissingPsiItemsTable({ rows = [] }: { rows?: PsiCompletenessEvaluation[] }) {
  return (
    <PsiCard title="Missing PSI Items" subtitle="Missing critical PSI can feed PSSR blockers and action/notification foundations.">
      {rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-warning/30 bg-warning/5 p-3"><p className="font-semibold">{row.category} - {row.requirement_name}</p><p className="text-sm text-[var(--psm-muted)]">{row.missing_reason}</p></div>)}</div> : <PsiEmptyState title="No missing PSI items" message="All evaluated PSI requirements are complete or mostly complete." />}
    </PsiCard>
  );
}
