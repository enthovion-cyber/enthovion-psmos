import { CompatibilityRatingBadge, MiReadinessImpactBadge, MocRequiredBadge, PssrBlockerBadge } from '../shared/MaterialCompatibilityBadges';
import { PsiCard } from '../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../types/material-compatibility.types';

export function CompatibilityCheckPanel({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.compatibility;
  return (
    <PsiCard title="Compatibility Check" subtitle="Backend-generated outcome from chemical/service, material details, rating, controls, degradation, and linked evidence.">
      <div className="grid gap-3 md:grid-cols-4">
        <div><p className="text-xs text-[var(--psm-muted)]">Rating</p><CompatibilityRatingBadge value={row.compatibility_rating} /></div>
        <div><p className="text-xs text-[var(--psm-muted)]">MOC</p><MocRequiredBadge value={row.moc_update_required} /></div>
        <div><p className="text-xs text-[var(--psm-muted)]">PSSR</p><PssrBlockerBadge value={row.pssr_blocker} /></div>
        <div><p className="text-xs text-[var(--psm-muted)]">MI</p><MiReadinessImpactBadge value={row.mi_readiness_impact} /></div>
      </div>
    </PsiCard>
  );
}

