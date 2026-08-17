import { ChemistryCompletenessBadge } from '../../shared/ChemistryCompletenessBadge';
import { PsiCard, PsiProgress } from '../../shared/PsiUi';

export function ChemistryCompletenessPanel({ chemistry, checks }: { chemistry: Record<string, any>; checks: Record<string, any>[] }) {
  return (
    <PsiCard title="Completeness / Missing Data" subtitle="Backend-generated readiness check feeding PSI, PSSR blockers, MOC update flags, review readiness, and missing data views.">
      <div className="mb-4 flex flex-wrap items-center gap-3"><ChemistryCompletenessBadge status={chemistry.completeness_status} score={chemistry.completeness_score} /><div className="min-w-52 flex-1"><PsiProgress value={Number(chemistry.completeness_score ?? 0)} /></div></div>
      <div className="grid gap-2 md:grid-cols-2">{checks.map((check) => <div key={String(check.id ?? check.check_key)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{check.check_title}</p><p className="text-sm text-[var(--psm-muted)]">{check.message ?? check.status}</p></div>)}</div>
    </PsiCard>
  );
}
