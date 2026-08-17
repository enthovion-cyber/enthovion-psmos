import { PsiCompletenessBadge } from '../../shared/PsiCompletenessBadge';

export function CompletenessScoreBadge({ score, status }: { score?: number | null | undefined; status?: string | null | undefined }) {
  return <PsiCompletenessBadge score={score ?? undefined} status={status ?? undefined} />;
}
