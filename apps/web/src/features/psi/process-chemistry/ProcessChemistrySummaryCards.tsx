import type { ProcessChemistrySummary } from '../types/process-chemistry.types';
import { PsiMetricCard } from '../shared/PsiUi';

export function ProcessChemistrySummaryCards({ summary }: { summary: ProcessChemistrySummary }) {
  const cards = [
    ['Total chemistry records', summary.totalChemistryRecords, 'neutral'],
    ['Units with chemistry', summary.unitsWithChemistryDefined, 'good'],
    ['Units missing chemistry', summary.unitsMissingChemistry, summary.unitsMissingChemistry ? 'warn' : 'good'],
    ['High hazard reactions', summary.highHazardReactions, summary.highHazardReactions ? 'danger' : 'good'],
    ['Exothermic reactions', summary.exothermicReactions, summary.exothermicReactions ? 'warn' : 'neutral'],
    ['Runaway potential', summary.runawayPotential, summary.runawayPotential ? 'danger' : 'good'],
    ['Decomposition hazards', summary.decompositionHazards, summary.decompositionHazards ? 'warn' : 'good'],
    ['Polymerization hazards', summary.polymerizationHazards, summary.polymerizationHazards ? 'warn' : 'good'],
    ['Toxic gas potential', summary.toxicGasPotential, summary.toxicGasPotential ? 'danger' : 'good'],
    ['Overpressure potential', summary.overpressurePotential, summary.overpressurePotential ? 'warn' : 'good'],
    ['Incompatible mixing', summary.incompatibleMixingRisks, summary.incompatibleMixingRisks ? 'danger' : 'good'],
    ['Missing conditions', summary.missingReactionConditions, summary.missingReactionConditions ? 'warn' : 'good'],
    ['Missing scenarios', summary.missingUnwantedScenarioData, summary.missingUnwantedScenarioData ? 'warn' : 'good'],
    ['MOC update required', summary.mocUpdateRequired, summary.mocUpdateRequired ? 'warn' : 'neutral'],
    ['PSSR blockers', summary.pssrBlockers, summary.pssrBlockers ? 'danger' : 'good']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, value, tone]) => <PsiMetricCard key={label} label={label} value={value} tone={tone} />)}</div>;
}
