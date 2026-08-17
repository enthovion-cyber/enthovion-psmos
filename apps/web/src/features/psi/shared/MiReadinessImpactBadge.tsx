import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function MiReadinessImpactBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="No impact" />;
}
