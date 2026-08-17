import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function SourceModuleBadge({ value }: { value?: string | null | undefined }) {
  return <PsiIntegrationBadge value={value} fallback="Source" />;
}
