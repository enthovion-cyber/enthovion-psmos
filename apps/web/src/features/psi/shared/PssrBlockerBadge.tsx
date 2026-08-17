import { PsiBadge } from './PsiReviewBadges';

export function PssrBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <PsiBadge value={value ? 'PSSR Blocker' : 'No PSSR Blocker'} />;
}
