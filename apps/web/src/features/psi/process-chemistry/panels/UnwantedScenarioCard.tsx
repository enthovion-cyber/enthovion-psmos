import { UnwantedScenarioSeverityBadge } from '../../shared/UnwantedScenarioSeverityBadge';

export function UnwantedScenarioCard({ scenario }: { scenario: Record<string, any> }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{scenario.scenario_title}</h3><UnwantedScenarioSeverityBadge value={scenario.severity} /></div>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">{scenario.scenario_type} - {scenario.deviation_condition ?? scenario.trigger_cause ?? 'No trigger recorded'}</p>
      <p className="mt-2 text-sm">{scenario.consequence ?? 'No consequence recorded.'}</p>
      {scenario.uncontrolled_high_severity ? <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 p-2 text-sm text-danger">Uncontrolled high-severity scenario. Safeguards and review are required.</p> : null}
    </div>
  );
}
