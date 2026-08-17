import { PsiCard } from '../../shared/PsiUi';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';
import { UnwantedScenarioCard } from '../panels/UnwantedScenarioCard';

export function UnwantedScenariosTab({ detail }: { detail: ProcessChemistryDetail }) {
  return <PsiCard title="Unwanted Reaction Scenarios" subtitle="Scenario register from backend PSI unwanted-reaction records.">{!detail.scenarios.length ? <p className="text-sm text-[var(--psm-muted)]">No unwanted reaction scenarios recorded.</p> : <div className="grid gap-3 md:grid-cols-2">{detail.scenarios.map((scenario) => <UnwantedScenarioCard key={String(scenario.id)} scenario={scenario} />)}</div>}</PsiCard>;
}
