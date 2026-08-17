import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function OutOfSyncBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Not checked" />;
}
