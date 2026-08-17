import { PsiCompletenessBadge } from '../../shared/PsiCompletenessBadge';

export function CompletenessStatusBadge({ status }: { status?: string | null | undefined }) {
  return <PsiCompletenessBadge status={status ?? 'Unknown / Needs Review'} />;
}
