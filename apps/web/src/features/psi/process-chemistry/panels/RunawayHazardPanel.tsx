import { PsiCard } from '../../shared/PsiUi';
import { ReactionHazardBadge } from '../../shared/ReactionHazardBadge';
import { RunawayPotentialBadge } from '../../shared/RunawayPotentialBadge';

export function RunawayHazardPanel({ chemistry, hazards }: { chemistry: Record<string, any>; hazards?: Record<string, any> | null | undefined }) {
  return (
    <PsiCard title="Runaway / Reactive Hazard Assessment" subtitle="Heat release, adiabatic temperature rise, runaway, decomposition, polymerization, overpressure, toxic gas, incompatible mixing, and test-basis state.">
      <div className="grid gap-3 md:grid-cols-4">
        <div><p className="text-xs uppercase text-[var(--psm-muted)]">Hazard level</p><ReactionHazardBadge value={chemistry.hazard_level} /></div>
        <div><p className="text-xs uppercase text-[var(--psm-muted)]">Runaway</p><RunawayPotentialBadge value={hazards?.runaway_potential ?? chemistry.runaway_potential} /></div>
        <div><p className="text-xs uppercase text-[var(--psm-muted)]">Decomposition</p><ReactionHazardBadge value={hazards?.decomposition_potential ?? chemistry.decomposition_potential} /></div>
        <div><p className="text-xs uppercase text-[var(--psm-muted)]">Polymerization</p><ReactionHazardBadge value={hazards?.polymerization_potential ?? chemistry.polymerization_potential} /></div>
      </div>
      <p className="mt-4 text-sm text-[var(--psm-muted)]">{hazards?.reaction_hazard_summary ?? 'No reaction hazard summary recorded.'}</p>
    </PsiCard>
  );
}
