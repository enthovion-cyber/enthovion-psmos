import { PsiCard, PsiEmptyState } from '../shared/PsiUi';
import { GoverningCaseBadge } from '../shared/GoverningCaseBadge';

export function GoverningScenarioPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  const governing = rows.filter((row) => Boolean(row.governing_case));
  return (
    <PsiCard title="Governing Scenario" subtitle="The governing relief case drives required relief rate, sizing, discharge, MI readiness, and review blockers.">
      {!governing.length ? <PsiEmptyState title="No governing case selected" message="Select a governing scenario before approving or locking relief basis readiness." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {governing.map((row) => <div key={String(row.id ?? row.scenario_type)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{String(row.scenario_type ?? 'Scenario')}</p><GoverningCaseBadge value /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.scenario_description ?? 'No description')}</p></div>)}
        </div>
      )}
    </PsiCard>
  );
}
