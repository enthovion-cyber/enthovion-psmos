import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function MocImpactBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Not assessed" />;
}
