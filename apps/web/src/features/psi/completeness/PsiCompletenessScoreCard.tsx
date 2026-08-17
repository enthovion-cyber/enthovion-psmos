import type { PsiCompletenessScore } from '../types/psi-completeness.types';
import { CompletenessScoreBadge } from '../components/shared/CompletenessScoreBadge';
import { PsiCard, PsiProgress } from '../shared/PsiUi';

export function PsiCompletenessScoreCard({ score }: { score?: PsiCompletenessScore | null }) {
  const value = Number(score?.score ?? 0);
  return (
    <PsiCard title={score?.score_module ?? score?.score_scope ?? 'Completeness Score'} subtitle={`${score?.complete_count ?? 0} complete, ${score?.missing_count ?? 0} missing, ${score?.waived_count ?? 0} waived`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-3xl font-bold">{Math.round(value)}%</p>
        <CompletenessScoreBadge score={value} status={score?.score_status} />
      </div>
      <div className="mt-4"><PsiProgress value={value} /></div>
      {score?.blocking_reasons_json?.length ? <ul className="mt-4 space-y-1 text-sm text-[var(--psm-muted)]">{score.blocking_reasons_json.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}
    </PsiCard>
  );
}
