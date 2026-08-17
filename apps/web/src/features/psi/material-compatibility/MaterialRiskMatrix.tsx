import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function MaterialRiskMatrix({ mechanisms }: { mechanisms: Array<Record<string, any>> }) {
  const counts = mechanisms.reduce<Record<string, number>>((acc, item) => {
    const key = item.risk_level ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <PsiCard title="Material Risk Matrix" subtitle="Real degradation mechanism counts grouped by backend risk level.">
      {!mechanisms.length ? <PsiEmptyState title="No matrix data" message="Add or import degradation mechanisms to generate the material risk matrix." /> : <div className="grid gap-2 sm:grid-cols-5">{['Low', 'Medium', 'High', 'Critical', 'Unknown'].map((level) => <div key={level} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-center"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{level}</p><p className="mt-2 text-2xl font-bold">{counts[level] ?? 0}</p></div>)}</div>}
    </PsiCard>
  );
}

