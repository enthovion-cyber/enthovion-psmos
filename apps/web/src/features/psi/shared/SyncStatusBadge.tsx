import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function SyncStatusBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Not checked" />;
}
