import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function HazopBasisStatusBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Not linked" />;
}
