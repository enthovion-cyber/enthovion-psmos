import type { PsiCompletenessResponse } from '../types/psi-completeness.types';
import { PsiCard, PsiProgress } from '../shared/PsiUi';
import { PsiCompletenessBadge } from '../shared/PsiCompletenessBadge';

export function CompletenessScoreCard({ completeness }: { completeness: PsiCompletenessResponse }) {
  return (
    <PsiCard title="Completeness Score" subtitle="Calculated by backend from PSI completeness requirements.">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-bold">{Math.round(completeness.score)}%</p>
          <div className="mt-2"><PsiCompletenessBadge status={completeness.status} score={completeness.score} /></div>
        </div>
        <div className="text-right text-sm text-[var(--psm-muted)]">
          <p>{completeness.criticalGapCount} critical gaps</p>
          <p>{completeness.pssrBlocker ? 'PSSR blocker active' : 'No PSSR blocker'}</p>
        </div>
      </div>
      <div className="mt-5"><PsiProgress value={completeness.score} /></div>
    </PsiCard>
  );
}
