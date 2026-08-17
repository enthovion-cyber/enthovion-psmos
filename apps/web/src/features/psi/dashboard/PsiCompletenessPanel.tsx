import { PsiCard, PsiProgress } from '../shared/PsiUi';
import { PsiCompletenessBadge } from '../shared/PsiCompletenessBadge';

export function PsiCompletenessPanel({ panel }: { panel?: { score: number; status: string; totalUnits: number } | undefined }) {
  const score = panel?.score ?? 0;
  return (
    <PsiCard title="PSI Completeness" subtitle="Backend-generated PSI completeness across active process units.">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-4xl font-bold">{score}%</p>
          <div className="mt-2"><PsiCompletenessBadge status={panel?.status} score={score} /></div>
        </div>
        <p className="text-right text-sm text-[var(--psm-muted)]">{panel?.totalUnits ?? 0} units evaluated</p>
      </div>
      <div className="mt-5"><PsiProgress value={score} /></div>
    </PsiCard>
  );
}
