import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function PssrReadinessBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Not checked" />;
}
