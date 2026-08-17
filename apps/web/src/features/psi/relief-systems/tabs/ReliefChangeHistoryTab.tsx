import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';

export function ReliefChangeHistoryTab({ detail }: { detail: ReliefSystemDetail }) {
  return (
    <PsiCard title="Change History" subtitle="Immutable PSI relief history and audit events for create, edit, archive, conflict check, completeness, MI sync, review, approval, and document links.">
      {!detail.history.length ? <PsiEmptyState title="No history events" message="History events will appear after relief-basis mutations or backend checks." /> : (
        <ol className="space-y-3">
          {detail.history.map((row) => <li key={String(row.id ?? row.created_at)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{String(row.event_title ?? row.event_type ?? 'History event')}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{String(row.created_at ?? '')}</p><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.event_description ?? row.reason ?? 'No description')}</p></li>)}
        </ol>
      )}
    </PsiCard>
  );
}
