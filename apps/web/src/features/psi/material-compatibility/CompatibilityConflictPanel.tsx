import { MaterialConflictBadge } from '../shared/MaterialCompatibilityBadges';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function CompatibilityConflictPanel({ conflicts }: { conflicts: Array<Record<string, any>> }) {
  return (
    <PsiCard title="Compatibility Conflicts" subtitle="Backend conflict results against Chemical/SDS, Equipment Design Basis, MI, SOL, Process Chemistry, Relief, MOC, PSSR, HAZOP, and evidence.">
      {!conflicts.length ? <PsiEmptyState title="No conflicts returned" message="Run the backend conflict check or verify related PSI/MI/chemical data is available." /> : <div className="space-y-2">{conflicts.map((conflict) => <div key={conflict.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{conflict.conflict_title ?? 'Conflict'}</p><MaterialConflictBadge value={conflict.conflict_status} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{conflict.conflict_description ?? conflict.finding ?? 'No description provided.'}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">Module: {conflict.compared_module ?? 'Not specified'} - Severity: {conflict.severity ?? 'Not specified'}</p></div>)}</div>}
    </PsiCard>
  );
}

