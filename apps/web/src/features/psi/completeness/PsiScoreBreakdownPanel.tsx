import type { PsiCompletenessScore } from '../types/psi-completeness.types';
import { PsiCard } from '../shared/PsiUi';

export function PsiScoreBreakdownPanel({ scores = [] }: { scores?: PsiCompletenessScore[] }) {
  const totals = scores.reduce((acc, score) => ({ complete: acc.complete + Number(score.complete_count ?? 0), partial: acc.partial + Number(score.partial_count ?? 0), missing: acc.missing + Number(score.missing_count ?? 0), waived: acc.waived + Number(score.waived_count ?? 0) }), { complete: 0, partial: 0, missing: 0, waived: 0 });
  return <PsiCard title="Score Breakdown" subtitle="Weighted requirement counts from the latest backend scoring records."><div className="grid gap-3 sm:grid-cols-4">{Object.entries(totals).map(([label, value]) => <div key={label} className="rounded-lg bg-[var(--psm-surface-2)] p-4"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</div></PsiCard>;
}
