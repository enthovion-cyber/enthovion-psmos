import { PsiBadge } from './PsiReviewBadges';

export function MocRequiredBadge({ value }: { value?: boolean | null | undefined }) {
  return <PsiBadge value={value ? 'MOC Required' : 'No MOC Required'} />;
}
