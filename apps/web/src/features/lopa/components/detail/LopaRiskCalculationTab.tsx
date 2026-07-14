'use client';

import { useState } from 'react';
import { useLopaRiskCalculation, useLopaRiskCalculationMutations } from '../../hooks/useLopaRiskCalculation';
import type { LopaRiskCalculationFilters } from '../../types/lopa-risk-calculation.types';
import { CalculationAssumptionsPanel } from '../risk-calculation/CalculationAssumptionsPanel';
import { CalculationFormulaMethodologyPanel } from '../risk-calculation/CalculationFormulaMethodologyPanel';
import { CalculationGapsActionsPanel } from '../risk-calculation/CalculationGapsActionsPanel';
import { CalculationResultsPanel } from '../risk-calculation/CalculationResultsPanel';
import { CalculationVersionSnapshotPanel } from '../risk-calculation/CalculationVersionSnapshotPanel';
import { ConditionalModifiersPanel } from '../risk-calculation/ConditionalModifiersPanel';
import { CreditedIplsPanel } from '../risk-calculation/CreditedIplsPanel';
import { ExcludedSafeguardsPanel } from '../risk-calculation/ExcludedSafeguardsPanel';
import { InitiatingEventFrequencyPanel } from '../risk-calculation/InitiatingEventFrequencyPanel';
import { RiskCalculationFilters } from '../risk-calculation/RiskCalculationFilters';
import { RiskCalculationHeader } from '../risk-calculation/RiskCalculationHeader';
import { RiskCalculationInputSnapshotPanel } from '../risk-calculation/RiskCalculationInputSnapshotPanel';
import { RiskCalculationReadinessPanel } from '../risk-calculation/RiskCalculationReadinessPanel';
import { RiskCalculationSummaryCards } from '../risk-calculation/RiskCalculationSummaryCards';
import { RiskGapRequiredRrfPanel } from '../risk-calculation/RiskGapRequiredRrfPanel';
import { SensitivityUncertaintyPreviewPanel } from '../risk-calculation/SensitivityUncertaintyPreviewPanel';
import { NeedsRecalculationBanner } from '../shared/NeedsRecalculationBanner';

export function LopaRiskCalculationTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<LopaRiskCalculationFilters>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useLopaRiskCalculation(id, filters);
  const mutations = useLopaRiskCalculationMutations(id);

  function fail(err: any, fallback: string) {
    const raw = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback;
    setError(typeof raw === 'string' ? raw : JSON.stringify(raw));
  }

  function actionNotes(label: string) {
    return window.prompt(label) || undefined;
  }

  function addAssumption() {
    const assumptionTitle = window.prompt('Assumption title');
    if (!assumptionTitle) return;
    const description = window.prompt('Description / basis') || undefined;
    mutations.createAssumption.mutate({ assumptionTitle, description, assumptionType: 'Calculation Basis' }, { onSuccess: () => setMessage('Assumption saved.'), onError: (err) => fail(err, 'Could not save assumption.') });
  }

  if (query.isLoading) return <State text="Loading risk calculation from API..." />;
  if (query.isError || !query.data) return <State text="Unable to load Risk Calculation. Check permissions and database schema." tone="error" />;

  const data = query.data;
  const readOnly = !!data.readOnly;
  const calculating = mutations.calculate.isPending || mutations.recalculate.isPending;
  const needsRecalculation = data.summary?.calculationStatus === 'Needs Recalculation' || data.calculation?.calculation_status === 'Needs Recalculation';

  return (
    <div className="space-y-4">
      {message ? <Toast text={message} tone="success" onClose={() => setMessage(null)} /> : null}
      {error ? <Toast text={error} tone="danger" onClose={() => setError(null)} /> : null}
      {readOnly ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">This LOPA calculation is read-only because the study is closed/approved or the latest calculation is locked.</div> : null}
      <NeedsRecalculationBanner show={needsRecalculation} />
      <RiskCalculationHeader
        header={data.header}
        readOnly={readOnly}
        calculating={calculating}
        onCalculate={() => mutations.calculate.mutate({ notes: actionNotes('Calculation notes') }, { onSuccess: () => setMessage('Risk calculation completed.'), onError: (err) => fail(err, 'Calculation failed.') })}
        onRecalculate={() => mutations.recalculate.mutate({ reason: actionNotes('Reason for recalculation') }, { onSuccess: () => setMessage('Risk recalculated.'), onError: (err) => fail(err, 'Recalculation failed.') })}
        onSnapshot={() => mutations.saveSnapshot.mutate({ notes: actionNotes('Snapshot notes') }, { onSuccess: () => setMessage('Calculation snapshot saved.'), onError: (err) => fail(err, 'Snapshot failed.') })}
        onLock={() => mutations.lock.mutate(actionNotes('Reason for locking calculation'), { onSuccess: () => setMessage('Calculation locked.'), onError: (err) => fail(err, 'Lock failed.') })}
        onUnlock={() => mutations.unlock.mutate(actionNotes('Reason for unlocking calculation'), { onSuccess: () => setMessage('Calculation unlocked and marked for recalculation.'), onError: (err) => fail(err, 'Unlock failed.') })}
        onExport={() => mutations.export.mutate(filters, { onSuccess: () => setMessage('Risk calculation export package generated by API.'), onError: (err) => fail(err, 'Export failed.') })}
      />
      <RiskCalculationSummaryCards summary={data.summary} />
      <RiskCalculationFilters filters={filters} setFilters={setFilters} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <RiskCalculationReadinessPanel readiness={data.readiness} />
        <RiskCalculationInputSnapshotPanel inputs={data.currentInputs} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InitiatingEventFrequencyPanel event={data.currentInputs.initiatingEvent} />
        <ConditionalModifiersPanel rows={data.currentInputs.conditionalModifiers} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <CreditedIplsPanel rows={data.currentInputs.creditedIpls} />
        <ExcludedSafeguardsPanel ipls={data.currentInputs.excludedIpls} safeguards={data.currentInputs.safeguards} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CalculationFormulaMethodologyPanel methodology={data.currentInputs.methodology ?? data.context.methodology} />
        <CalculationResultsPanel summary={data.summary} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RiskGapRequiredRrfPanel summary={data.summary} />
        <SensitivityUncertaintyPreviewPanel calculation={data.calculation} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CalculationAssumptionsPanel rows={data.assumptions} readOnly={readOnly} onAdd={addAssumption} />
        <CalculationVersionSnapshotPanel rows={data.versions} />
      </div>
      <CalculationGapsActionsPanel
        rows={data.gaps}
        readOnly={readOnly}
        onCreateMissing={() => mutations.createMissingInputActions.mutate(undefined, { onSuccess: () => setMessage('Missing-input gaps recorded for action tracking.'), onError: (err) => fail(err, 'Could not create missing-input actions.') })}
        onCreateRiskGapAction={() => mutations.createRiskGapAction.mutate(undefined, { onSuccess: () => setMessage('Risk gap action created or queued.'), onError: (err) => fail(err, 'Could not create risk gap action.') })}
        onCreateAction={(gapId) => mutations.createGapAction.mutate(gapId, { onSuccess: () => setMessage('Gap action linked.'), onError: (err) => fail(err, 'Could not link gap action.') })}
      />
    </div>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>;
}

function Toast({ text, tone, onClose }: { text: string; tone: 'success' | 'danger'; onClose: () => void }) {
  const cls = tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-red-400/30 bg-red-500/10 text-red-100';
  return <div className={`flex items-center justify-between rounded-xl border p-3 text-sm ${cls}`}><span>{text}</span><button className="text-xs font-bold" onClick={onClose}>Close</button></div>;
}
