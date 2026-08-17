import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function ReviewOverduePanel({ rows = [] }: { rows?: PsiUnit[] | undefined }) {
  return (
    <PsiCard title="Review Overdue" subtitle="Units whose next review date has passed.">
      {rows.length ? <ul className="space-y-2">{rows.map((unit) => <li key={unit.id} className="rounded-lg border border-[var(--psm-line)] p-3"><span className="font-semibold">{unit.unit_code}</span><span className="text-[var(--psm-muted)]"> - Due {unit.next_review_due ?? 'not set'}</span></li>)}</ul> : <PsiEmptyState title="No overdue reviews" message="Visible PSI unit review dates are current." />}
    </PsiCard>
  );
}
