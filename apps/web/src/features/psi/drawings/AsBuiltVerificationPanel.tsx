import { PsiCard } from '../shared/PsiUi';

export function AsBuiltVerificationPanel({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <PsiCard title="As-Built Verification" subtitle="Field walkdown and verification evidence history. Verification creates audit and PSI history.">
      {!rows.length ? <p className="text-sm text-[var(--psm-muted)]">No as-built verification records yet.</p> : <div className="space-y-3">{rows.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{String(row.verification_type ?? 'Verification')}</p><p className="text-sm text-[var(--psm-muted)]">{String(row.findings_summary ?? row.comments ?? 'No findings summary')}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{String(row.verified_at ?? row.created_at ?? '')}</p></div>)}</div>}
    </PsiCard>
  );
}
