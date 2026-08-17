import { PsiCard } from '../../shared/PsiUi';
import { UnwantedScenarioSeverityBadge } from '../../shared/UnwantedScenarioSeverityBadge';

export function UnwantedScenariosSection({ scenarios }: { scenarios?: Record<string, any>[] | undefined }) {
  return (
    <PsiCard title="Unwanted Reaction Scenarios" subtitle="Deviations, triggers, wrong additions, contamination, loss of cooling/agitation/inerting, vent blockage, runaway, toxic gas, fire/explosion, safeguards, and emergency response.">
      {!scenarios?.length ? <p className="text-sm text-[var(--psm-muted)]">No unwanted reaction scenarios have been assessed yet.</p> : <div className="grid gap-3 md:grid-cols-2">{scenarios.map((scenario) => <div key={String(scenario.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{scenario.scenario_title}</p><UnwantedScenarioSeverityBadge value={String(scenario.severity ?? '')} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{scenario.consequence ?? scenario.trigger_cause ?? 'No consequence recorded'}</p></div>)}</div>}
    </PsiCard>
  );
}
