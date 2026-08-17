import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function IntegrationStatusBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="No status" />;
}
