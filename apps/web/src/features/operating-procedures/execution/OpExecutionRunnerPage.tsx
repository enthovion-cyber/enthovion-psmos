'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  OpBadge,
  OpButton,
  OpCard,
  OpEmpty,
  OpError,
  OpField,
  OpLoading,
  fmtDate,
  fmtDateTime,
  opInput
} from '../shared/OpUi';
import {
  useOpExecution,
  useOpExecutionMutations
} from '../hooks/useOperatingProcedures';
import type { OpExecutionHold, OpExecutionStep } from '../types/operating-procedures.types';

export function OpExecutionRunnerPage({ executionId: propId }: { executionId?: string }) {
  const router = useRouter();
  const routeParams = useParams<{ executionId: string }>();
  const executionId = propId || routeParams?.executionId || '';
  const { data: run, isLoading, error, refetch } = useOpExecution(executionId);
  const mutations = useOpExecutionMutations(executionId);

  // Local state for step inputs (recorded values and notes)
  const [stepInputs, setStepInputs] = useState<Record<string, { value: string; notes: string }>>({});

  // Modals state
  const [activeHoldToRelease, setActiveHoldToRelease] = useState<OpExecutionHold | null>(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isDeviationOpen, setIsDeviationOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isAbortOpen, setIsAbortOpen] = useState(false);

  // Handover form state
  const [shiftTo, setShiftTo] = useState('Night Shift');
  const [incomingSupervisorId, setIncomingSupervisorId] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [equipmentStatus, setEquipmentStatus] = useState('Operating within safe parameters');

  // Manual Deviation form state
  const [devParam, setDevParam] = useState('');
  const [devExpected, setDevExpected] = useState('');
  const [devActual, setDevActual] = useState('');
  const [devSeverity, setDevSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [devDesc, setDevDesc] = useState('');
  const [devAction, setDevAction] = useState('');

  // Complete / Abort form state
  const [supervisorNotes, setSupervisorNotes] = useState('All steps verified in compliance with OSHA 1910.119(f) safe work practices.');
  const [abortReason, setAbortReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Active Hold Points
  const activeHolds = useMemo(() => {
    return run?.holds?.filter((h) => h.status === 'Holding') || [];
  }, [run]);

  const handleInputValueChange = (stepId: string, val: string) => {
    setStepInputs((prev) => ({
      ...prev,
      [stepId]: {
        value: val,
        notes: prev[stepId]?.notes || ''
      }
    }));
  };

  const handleInputNotesChange = (stepId: string, notesVal: string) => {
    setStepInputs((prev) => ({
      ...prev,
      [stepId]: {
        value: prev[stepId]?.value || '',
        notes: notesVal
      }
    }));
  };

  // Perform Step Check-off
  const handlePerformStep = async (step: OpExecutionStep, isWitnessing = false) => {
    setActionError(null);
    const local = stepInputs[step.id];
    const recValue = local?.value !== undefined ? local.value : (step.recorded_value || '');
    const notes = local?.notes !== undefined ? local.notes : (step.notes || '');

    try {
      await mutations.recordStep.mutateAsync({
        stepId: step.id,
        data: {
          status: 'Completed',
          recordedValue: recValue,
          notes,
          isWitnessing
        }
      });
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to record step execution.');
    }
  };

  // Skip Step
  const handleSkipStep = async (step: OpExecutionStep) => {
    const reason = prompt(`Enter reason for skipping Step ${step.step_number}:`);
    if (!reason) return;
    setActionError(null);
    try {
      await mutations.recordStep.mutateAsync({
        stepId: step.id,
        data: {
          status: 'Skipped',
          skipReason: reason
        }
      });
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to skip step.');
    }
  };

  // Release Hold
  const handleReleaseHoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHoldToRelease) return;
    setActionError(null);
    try {
      await mutations.releaseHold.mutateAsync({
        holdId: activeHoldToRelease.id,
        data: {
          action: 'Released',
          releaseNotes: releaseNotes || 'Hold point authorized and released by supervisor.',
          markStepCompleted: true
        }
      });
      setActiveHoldToRelease(null);
      setReleaseNotes('');
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to release hold point.');
    }
  };

  // Submit Shift Handover
  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await mutations.recordHandover.mutateAsync({
        shiftTo,
        incomingSupervisorId: incomingSupervisorId || 'usr-supervisor-incoming',
        handoverNotes,
        equipmentStatus
      });
      setIsHandoverOpen(false);
      setHandoverNotes('');
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to record handover.');
    }
  };

  // Submit Deviation
  const handleDeviationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await mutations.logDeviation.mutateAsync({
        parameterName: devParam,
        expectedLimits: devExpected,
        actualValue: devActual,
        deviationSeverity: devSeverity,
        deviationDescription: devDesc,
        immediateCorrectiveAction: devAction
      });
      setIsDeviationOpen(false);
      setDevParam('');
      setDevActual('');
      setDevDesc('');
      setDevAction('');
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to log deviation.');
    }
  };

  // Complete Run
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await mutations.completeExecution.mutateAsync({
        supervisorNotes
      });
      setIsCompleteOpen(false);
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete execution.');
    }
  };

  // Abort Run
  const handleAbortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await mutations.abortExecution.mutateAsync({
        abortReason: abortReason || 'Aborted by operator.'
      });
      setIsAbortOpen(false);
      refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to abort execution.');
    }
  };

  if (isLoading) return <div className="p-6"><OpLoading rows={8} /></div>;
  if (error || !run) return <div className="p-6"><OpError error={error || 'Execution not found'} onRetry={refetch} /></div>;

  const pct = run.total_steps > 0 ? Math.round((run.completed_steps / run.total_steps) * 100) : 0;
  const isTerminal = run.status === 'Completed' || run.status === 'Aborted';

  return (
    <div className="min-h-screen bg-[var(--psm-surface-2)] pb-24">
      {/* Sticky Top Header for Field Operators */}
      <header className="sticky top-0 z-30 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 py-3 shadow-md backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Link
                href="/operating-procedures/executions"
                className="text-xs font-semibold text-primary hover:underline"
              >
                &larr; All Runs
              </Link>
              <span className="text-[var(--psm-muted)]">&bull;</span>
              <span className="font-mono text-sm font-bold text-primary">{run.execution_number}</span>
              <OpBadge tone={run.status === 'Completed' ? 'good' : run.status === 'In Progress' ? 'warn' : 'neutral'}>
                {run.status}
              </OpBadge>
              <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--psm-muted)]">
                {run.execution_mode}
              </span>
            </div>
            <h1 className="text-base font-bold text-[var(--psm-fg)] sm:text-lg">
              {run.procedure?.procedure_number}: {run.procedure?.title}
            </h1>
            <p className="text-xs text-[var(--psm-muted)]">
              Shift: <span className="font-medium text-[var(--psm-fg)]">{run.shift}</span> &bull; Crew:{' '}
              <span className="font-medium text-[var(--psm-fg)]">{run.crew || 'Alpha'}</span> &bull; Rev:{' '}
              <span className="font-medium text-[var(--psm-fg)]">{run.revision?.revision_label || 'Rev 1.0'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isTerminal && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDeviationOpen(true)}
                  className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20"
                >
                  ! Log Deviation
                </button>
                <button
                  type="button"
                  onClick={() => setIsHandoverOpen(true)}
                  className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]"
                >
                  Shift Handover
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(true)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  Complete & Sign &rarr;
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="mx-auto mt-2 max-w-6xl">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--psm-muted)]">
            <span>
              Progress: {run.completed_steps} of {run.total_steps} steps completed ({pct}%)
            </span>
            <div className="flex items-center gap-3">
              {run.deviated_steps > 0 && <span className="text-danger font-semibold">{run.deviated_steps} Deviations</span>}
              {run.skipped_steps > 0 && <span>{run.skipped_steps} Skipped</span>}
            </div>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
            <div
              className={`h-full transition-all duration-300 ${
                run.deviated_steps > 0 ? 'bg-amber-500' : run.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {actionError && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            <p className="font-bold">Execution Error</p>
            <p className="mt-0.5">{actionError}</p>
          </div>
        )}

        {/* Active Hold Points Banner */}
        {activeHolds.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/15 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    !
                  </span>
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    MANDATORY SUPERVISOR HOLD POINT ACTIVE ({activeHolds.length})
                  </h3>
                </div>
                <p className="mt-1 text-xs text-[var(--psm-muted)]">
                  OSHA Safe Work Practice requires formal supervisor release before proceeding beyond this verification point.
                </p>
                <div className="mt-2 space-y-1">
                  {activeHolds.map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded bg-[var(--psm-surface)] p-2 text-xs">
                      <span className="font-medium text-[var(--psm-fg)]">
                        Step {h.step_number}: {h.hold_reason}
                      </span>
                      {!isTerminal && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveHoldToRelease(h);
                            setReleaseNotes('');
                          }}
                          className="rounded bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-500"
                        >
                          Release Hold
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Execution Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Digital Operating Checklist ({run.steps?.length || 0} Steps)
            </h2>
            <span className="text-xs text-[var(--psm-muted)]">
              Auto-saves on sign-off &bull; Verified against Process Safety Information
            </span>
          </div>

          {run.steps?.map((step, idx) => {
            const isCompleted = step.status === 'Completed';
            const isDeviated = step.status === 'Deviated';
            const isSkipped = step.status === 'Skipped';
            const isPending = step.status === 'Pending' || step.status === 'In Progress';
            const localInput = stepInputs[step.id] || { value: step.recorded_value || '', notes: step.notes || '' };

            // Live SOL Limit Check
            const numVal = parseFloat(localInput.value);
            const hasSolLimits = step.min_value !== null || step.max_value !== null;
            let solStatus: 'normal' | 'out_of_limits' | 'empty' = 'empty';
            if (!isNaN(numVal) && hasSolLimits) {
              const belowMin = step.min_value !== null && numVal < Number(step.min_value);
              const aboveMax = step.max_value !== null && numVal > Number(step.max_value);
              solStatus = belowMin || aboveMax ? 'out_of_limits' : 'normal';
            }

            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isDeviated
                    ? 'border-danger/40 bg-danger/5'
                    : isSkipped
                    ? 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] opacity-70'
                    : step.is_hold_point
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-[var(--psm-line)] bg-[var(--psm-surface)]'
                }`}
              >
                {/* Step Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--psm-line)]/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--psm-surface-2)] font-mono text-xs font-bold text-[var(--psm-fg)]">
                      {step.step_number}
                    </span>
                    <span className="text-xs font-medium text-[var(--psm-muted)]">{step.section_title}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {step.is_critical && (
                      <span className="rounded bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger border border-danger/30">
                        CRITICAL SAFETY
                      </span>
                    )}
                    {step.is_hold_point && (
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 border border-amber-500/30">
                        HOLD POINT
                      </span>
                    )}
                    {step.requires_witness && (
                      <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 border border-purple-500/30">
                        TWO-PERSON WITNESS
                      </span>
                    )}
                    <OpBadge tone={isCompleted ? 'good' : isDeviated ? 'danger' : isSkipped ? 'neutral' : 'info'}>
                      {step.status}
                    </OpBadge>
                  </div>
                </div>

                {/* Step Content */}
                <div className="mt-3 space-y-3">
                  {step.step_title && (
                    <h3 className="text-base font-bold text-[var(--psm-fg)]">{step.step_title}</h3>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--psm-fg)]">
                    {step.step_text}
                  </p>

                  {/* Expected Safe Operating Limits display */}
                  {step.expected_limits && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs">
                      <span className="font-semibold text-primary">Safe Operating Limits (OSHA 1910.119(f)(1)(ii)): </span>
                      <span className="font-mono font-medium text-[var(--psm-fg)]">{step.expected_limits}</span>
                    </div>
                  )}

                  {/* Value Capture & Live SOL evaluation */}
                  {(step.step_type === 'record_value' || hasSolLimits || step.expected_limits) && (
                    <div className="mt-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-[var(--psm-fg)] block mb-1">
                            Recorded Reading {step.uom ? `(${step.uom})` : ''}
                          </label>
                          <input
                            type="text"
                            disabled={isTerminal || isCompleted}
                            className={opInput}
                            placeholder={`e.g. 135 ${step.uom || ''}`}
                            value={localInput.value}
                            onChange={(e) => handleInputValueChange(step.id, e.target.value)}
                          />
                        </div>

                        {/* Live SOL Indicator */}
                        <div className="flex flex-col justify-end">
                          {solStatus === 'normal' && (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 p-2 text-xs font-semibold text-emerald-600">
                              &check; Value is within Safe Operating Limits ({step.min_value} - {step.max_value} {step.uom})
                            </div>
                          )}
                          {solStatus === 'out_of_limits' && (
                            <div className="rounded-lg border border-danger/40 bg-danger/15 p-2 text-xs font-bold text-danger animate-pulse">
                              &times; OUT OF LIMITS! Submitting will record a safety deviation to Process Safety Register.
                            </div>
                          )}
                          {solStatus === 'empty' && hasSolLimits && (
                            <div className="text-xs text-[var(--psm-muted)] p-2">
                              Expected limit: {step.min_value} - {step.max_value} {step.uom}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Audit Trail */}
                  {isCompleted && (
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="font-bold">&check; Signed Off</span> at {fmtDateTime(step.performed_at)}
                      {step.recorded_value && (
                        <span className="ml-2 font-mono">
                          (Recorded: {step.recorded_value} {step.uom || ''})
                        </span>
                      )}
                      {step.witness_at && (
                        <span className="ml-3 font-semibold text-purple-600">
                          &bull; Independent Witness Verified at {fmtDateTime(step.witness_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {isDeviated && (
                    <div className="rounded-lg bg-danger/10 p-2.5 text-xs text-danger">
                      <span className="font-bold">&times; Deviated from Safe Operating Limit: </span>
                      {step.deviation_reason || 'Recorded value exceeded operating boundaries.'}
                    </div>
                  )}

                  {isSkipped && (
                    <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5 text-xs text-[var(--psm-muted)]">
                      <span className="font-semibold">Step Skipped: </span>
                      {step.skip_reason || 'No justification provided'}
                    </div>
                  )}

                  {/* Execution Action Bar per step */}
                  {!isTerminal && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--psm-line)]/40">
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            type="button"
                            disabled={mutations.recordStep.isPending}
                            onClick={() => handlePerformStep(step)}
                            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                          >
                            Sign & Complete Step
                          </button>
                        )}

                        {step.requires_witness && isCompleted && !step.witness_at && (
                          <button
                            type="button"
                            disabled={mutations.recordStep.isPending}
                            onClick={() => handlePerformStep(step, true)}
                            className="rounded-lg border border-purple-500/30 bg-purple-500/15 px-3 py-2 text-xs font-bold text-purple-600 hover:bg-purple-500/25"
                          >
                            Witness Verify (Independent Signer)
                          </button>
                        )}
                      </div>

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleSkipStep(step)}
                          className="text-xs font-medium text-[var(--psm-muted)] hover:text-danger"
                        >
                          Skip Step...
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Release Hold Point Modal */}
      {activeHoldToRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
            <h3 className="text-base font-bold text-[var(--psm-fg)]">Release Safe Work Hold Point</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Authorized Operations Supervisor release for Step {activeHoldToRelease.step_number}.
            </p>
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              {activeHoldToRelease.hold_reason}
            </div>

            <form onSubmit={handleReleaseHoldSubmit} className="mt-4 space-y-4">
              <OpField label="Supervisor Verification Notes & Justification" required>
                <textarea
                  rows={3}
                  className={opInput}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="e.g. Field verification confirmed: line depressurized and bleeder open. Authorized to proceed."
                  required
                />
              </OpField>

              <div className="flex justify-end gap-2 pt-2">
                <OpButton variant="secondary" onClick={() => setActiveHoldToRelease(null)}>
                  Cancel
                </OpButton>
                <button
                  type="submit"
                  disabled={mutations.releaseHold.isPending}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500"
                >
                  {mutations.releaseHold.isPending ? 'Releasing...' : 'Release Hold & Sign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Handover Modal */}
      {isHandoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--psm-fg)]">Shift Handover Log</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Formally transfer execution ownership to incoming shift without breaking LOTO or safe practice continuity.
            </p>

            <form onSubmit={handleHandoverSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <OpField label="Incoming Shift" required>
                  <select className={opInput} value={shiftTo} onChange={(e) => setShiftTo(e.target.value)}>
                    <option value="Night Shift">Night Shift (19:00 - 07:00)</option>
                    <option value="Day Shift">Day Shift (07:00 - 19:00)</option>
                    <option value="Swing Shift">Swing Shift</option>
                  </select>
                </OpField>

                <OpField label="Incoming Supervisor ID / Tag">
                  <input
                    type="text"
                    className={opInput}
                    value={incomingSupervisorId}
                    onChange={(e) => setIncomingSupervisorId(e.target.value)}
                    placeholder="e.g. SUP-JSMITH"
                  />
                </OpField>
              </div>

              <OpField label="Current Equipment / Isolation Status">
                <input
                  type="text"
                  className={opInput}
                  value={equipmentStatus}
                  onChange={(e) => setEquipmentStatus(e.target.value)}
                  placeholder="e.g. Pump P-101 isolated, valves V-12 closed and tagged"
                />
              </OpField>

              <OpField label="Detailed Handover Notes" required>
                <textarea
                  rows={3}
                  className={opInput}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Detail step in progress, outstanding actions, and any abnormal conditions..."
                  required
                />
              </OpField>

              <div className="flex justify-end gap-2 pt-2">
                <OpButton variant="secondary" onClick={() => setIsHandoverOpen(false)}>
                  Cancel
                </OpButton>
                <OpButton variant="primary" type="submit" disabled={mutations.recordHandover.isPending}>
                  {mutations.recordHandover.isPending ? 'Logging Handover...' : 'Transfer Shift'}
                </OpButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Deviation Modal */}
      {isDeviationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-danger">Log Safe Operating Limit (SOL) Deviation</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Document an abnormal reading, process upset, or deviation from safe work procedures (OSHA 1910.119(f)(1)(ii)).
            </p>

            <form onSubmit={handleDeviationSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <OpField label="Parameter Name" required>
                  <input
                    type="text"
                    className={opInput}
                    value={devParam}
                    onChange={(e) => setDevParam(e.target.value)}
                    placeholder="e.g. Reactor R-101 Pressure"
                    required
                  />
                </OpField>

                <OpField label="Deviation Severity">
                  <select
                    className={opInput}
                    value={devSeverity}
                    onChange={(e) => setDevSeverity(e.target.value as any)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical Safety</option>
                  </select>
                </OpField>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <OpField label="Expected Limits">
                  <input
                    type="text"
                    className={opInput}
                    value={devExpected}
                    onChange={(e) => setDevExpected(e.target.value)}
                    placeholder="e.g. 50 - 75 PSI"
                  />
                </OpField>

                <OpField label="Actual Value Recorded" required>
                  <input
                    type="text"
                    className={opInput}
                    value={devActual}
                    onChange={(e) => setDevActual(e.target.value)}
                    placeholder="e.g. 84.5 PSI"
                    required
                  />
                </OpField>
              </div>

              <OpField label="Deviation Description & Cause" required>
                <textarea
                  rows={2}
                  className={opInput}
                  value={devDesc}
                  onChange={(e) => setDevDesc(e.target.value)}
                  placeholder="Describe what occurred, potential cause, and immediate observation..."
                  required
                />
              </OpField>

              <OpField label="Immediate Corrective Action Taken" required>
                <textarea
                  rows={2}
                  className={opInput}
                  value={devAction}
                  onChange={(e) => setDevAction(e.target.value)}
                  placeholder="Steps taken to bring process back within safe limits or initiate emergency shutdown..."
                  required
                />
              </OpField>

              <div className="flex justify-end gap-2 pt-2">
                <OpButton variant="secondary" onClick={() => setIsDeviationOpen(false)}>
                  Cancel
                </OpButton>
                <button
                  type="submit"
                  disabled={mutations.logDeviation.isPending}
                  className="rounded-lg bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/90"
                >
                  {mutations.logDeviation.isPending ? 'Logging...' : 'Log Deviation to PSM Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Execution Modal */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--psm-fg)]">Finalize & Sign Off Execution Run</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Formally close and archive this execution run in accordance with OSHA 1910.119(f) safe work practices.
            </p>

            <div className="mt-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs space-y-1">
              <div>Total Steps: <span className="font-semibold">{run.total_steps}</span></div>
              <div>Completed: <span className="font-semibold text-emerald-600">{run.completed_steps}</span></div>
              <div>Skipped: <span className="font-semibold text-amber-600">{run.skipped_steps}</span></div>
              <div>Deviations: <span className="font-semibold text-danger">{run.deviated_steps}</span></div>
            </div>

            <form onSubmit={handleCompleteSubmit} className="mt-4 space-y-4">
              <OpField label="Supervisor Verification Statement & Notes" required>
                <textarea
                  rows={3}
                  className={opInput}
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  required
                />
              </OpField>

              <div className="flex justify-end gap-2 pt-2">
                <OpButton variant="secondary" onClick={() => setIsCompleteOpen(false)}>
                  Cancel
                </OpButton>
                <button
                  type="submit"
                  disabled={mutations.completeExecution.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  {mutations.completeExecution.isPending ? 'Signing...' : 'Sign Off & Complete Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
