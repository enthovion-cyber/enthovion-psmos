import { PsiIntegrationBadge } from './PsiIntegrationBadges';

export function MiReadinessImpactBadge({ value }: { value?: string | boolean | null | undefined }) {
  const display = typeof value === 'boolean' ? (value ? 'MI Readiness Impact' : 'No MI Impact') : value;
  return <PsiIntegrationBadge value={display} fallback="No impact" />;
}
