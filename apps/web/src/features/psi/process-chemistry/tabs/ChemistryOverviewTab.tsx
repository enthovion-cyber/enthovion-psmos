import { PsiCard, PsiMetricCard } from '../../shared/PsiUi';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';
import { ChemistryCompletenessPanel } from '../panels/ChemistryCompletenessPanel';
import { RunawayHazardPanel } from '../panels/RunawayHazardPanel';
import { UnwantedScenarioCard } from '../panels/UnwantedScenarioCard';

export function ChemistryOverviewTab({ detail }: { detail: ProcessChemistryDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={card.value} tone={card.tone ?? 'neutral'} />)}</div>
      <RunawayHazardPanel chemistry={detail.chemistry} hazards={detail.hazards} />
      <PsiCard title="Unwanted Scenario Snapshot" subtitle="High-consequence deviations and reaction hazard cases from backend scenario records.">
        {!detail.scenarios.length ? <p className="text-sm text-[var(--psm-muted)]">No unwanted scenarios recorded.</p> : <div className="grid gap-3 md:grid-cols-2">{detail.scenarios.slice(0, 4).map((scenario) => <UnwantedScenarioCard key={String(scenario.id)} scenario={scenario} />)}</div>}
      </PsiCard>
      <ChemistryCompletenessPanel chemistry={detail.chemistry} checks={detail.completeness} />
    </div>
  );
}
