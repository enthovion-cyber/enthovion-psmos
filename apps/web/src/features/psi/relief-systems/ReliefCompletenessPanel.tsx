import { PsiCard, PsiEmptyState } from '../shared/PsiUi';
import { ReliefCompletenessBadge } from '../shared/ReliefCompletenessBadge';

export function ReliefCompletenessPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <PsiCard title="Relief Completeness / Missing Data" subtitle="Backend-generated completeness checks for protected equipment, device links, governing cases, sizing, destination, documents, MI sync, MOC, and PSSR readiness.">
      {!rows.length ? <PsiEmptyState title="No completeness checks yet" message="Run the backend completeness check to generate PDF-required missing-data and readiness results." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => <div key={String(row.id ?? row.check_key)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{String(row.check_label ?? row.check_key ?? 'Completeness check')}</p><ReliefCompletenessBadge value={String(row.status ?? 'Not Reviewed')} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.message ?? row.details ?? 'No message')}</p></div>)}
        </div>
      )}
    </PsiCard>
  );
}
