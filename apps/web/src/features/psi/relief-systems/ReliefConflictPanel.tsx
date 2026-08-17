import { PsiCard, PsiEmptyState } from '../shared/PsiUi';
import { ReliefConflictBadge } from '../shared/ReliefConflictBadge';

export function ReliefConflictPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <PsiCard title="Relief Conflict Results" subtitle="Backend-generated conflicts against SOL, Equipment Design Basis, MI relief devices, protected equipment, governing cases, capacity, destination, MOC, and PSSR.">
      {!rows.length ? <PsiEmptyState title="No conflicts found" message="Run the conflict check to compare this relief basis against linked PSI/MI sources." /> : (
        <div className="space-y-3">
          {rows.map((row) => <div key={String(row.id ?? row.conflict_key)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{String(row.conflict_title ?? row.conflict_key ?? 'Relief conflict')}</p><ReliefConflictBadge value={String(row.status ?? row.severity ?? 'Warning')} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.description ?? row.message ?? 'No description')}</p></div>)}
        </div>
      )}
    </PsiCard>
  );
}
