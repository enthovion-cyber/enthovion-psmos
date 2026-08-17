import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function ImpactSeverityBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Info" />;
}
