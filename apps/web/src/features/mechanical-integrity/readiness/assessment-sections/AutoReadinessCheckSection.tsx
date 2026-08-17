'use client';

import { ActionButton, KeyValueGrid, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

type Props = {
  initial?: Record<string, any> | undefined;
  canRun: boolean;
  running?: boolean | undefined;
  disabledReason?: string | undefined;
  onRun?: (() => void) | undefined;
};

export function AutoReadinessCheckSection({ initial, canRun, running, disabledReason, onRun }: Props) {
  return (
    <SectionCard
      title="2. Auto Readiness Check"
      description="Runs the backend source-of-truth check across deficiencies, deviations, work orders, inspections, CML/TML, PM, calibration, PSV, SIS/SIF, impairments, documents, MOC, and PSSR."
      actions={<ActionButton onClick={onRun} disabled={!canRun || running} title={disabledReason}>{running ? 'Checking...' : 'Run Backend Check'}</ActionButton>}
    >
      <KeyValueGrid items={[
        ['Backend recommendation', initial?.recommended_decision],
        ['Decision source', initial?.decision_source ?? 'Backend readiness engine'],
        ['Operation allowed', initial?.operation_allowed],
        ['Startup blocked', initial?.startup_blocked],
        ['MOC required', initial?.moc_required],
        ['PSSR impact', initial?.pssr_impact],
        ['LOPA/SIL impact', initial?.lopa_sil_impact],
        ['Last updated', initial?.updated_at]
      ]} />
    </SectionCard>
  );
}
