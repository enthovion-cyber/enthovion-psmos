'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useOpAuthoringMutations,
  useOpProcedure,
  useOpRevision
} from '../hooks/useOperatingProcedures';
import {
  OpBadge,
  OpButton,
  OpCard,
  OpEmpty,
  OpError,
  OpField,
  OpHeader,
  OpLayout,
  OpLoading,
  criticalityTone,
  fmtDate,
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import type { OpSection, OpStep, OpStepHazard } from '../types/operating-procedures.types';

export function OpStepEditorPage() {
  const params = useParams();
  const router = useRouter();
  const procedureId = String(params.procedureId);

  const procQuery = useOpProcedure(procedureId);
  const currentRevId = procQuery.data?.current_revision_id;

  const revQuery = useOpRevision(procedureId, currentRevId ?? undefined);
  const mutations = useOpAuthoringMutations(procedureId, currentRevId ?? undefined);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showAddHazardModal, setShowAddHazardModal] = useState<string | null>(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New step form state
  const [stepForm, setStepForm] = useState({
    stepNumber: '1.0',
    stepTitle: '',
    stepText: '',
    stepType: 'action' as OpStep['step_type'],
    roleRequired: 'Field Operator',
    isCritical: false,
    requiresSignoff: true,
    requiresWitness: false,
    expectedValue: '',
    minValue: '',
    maxValue: '',
    uom: '',
    equipmentTag: '',
    branchCondition: '',
    branchNextStep: ''
  });

  // Hazard callout form state
  const [hazardForm, setHazardForm] = useState({
    hazardLevel: 'WARNING' as OpStepHazard['hazard_level'],
    hazardText: '',
    consequenceOfDeviation: '',
    correctiveSteps: '',
    ppeRequired: 'Safety Glasses, Nitrile Gloves'
  });

  // New section form state
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionKind, setSectionKind] = useState<OpSection['section_kind']>('steps');

  if (procQuery.isLoading || (currentRevId && revQuery.isLoading)) {
    return (
      <OpLayout current="Editor">
        <OpLoading rows={8} />
      </OpLayout>
    );
  }

  if (procQuery.isError || revQuery.isError) {
    return (
      <OpLayout current="Editor">
        <OpError
          error={procQuery.error ?? revQuery.error}
          onRetry={() => {
            procQuery.refetch();
            revQuery.refetch();
          }}
        />
      </OpLayout>
    );
  }

  const p = procQuery.data;
  const rev = revQuery.data;

  // Handle case where procedure has no revision yet
  if (!currentRevId || !rev) {
    return (
      <OpLayout current="Editor">
        <div className="space-y-6">
          <OpHeader
            title={`${p?.procedure_number}: Digital Step Editor`}
            subtitle="Author interactive procedure checklists, safe operating limits, and hazard deviation callouts."
          />
          <OpCard title="No Active Draft Revision">
            <p className="text-sm text-[var(--psm-muted)]">
              This procedure currently does not have an open draft revision. Start revision 1.0 to begin authoring digital steps.
            </p>
            <div className="mt-4">
              <OpButton
                onClick={async () => {
                  try {
                    await mutations.createRevision.mutateAsync({
                      revisionLabel: 'Rev 1.0',
                      changeReason: 'Initial Draft',
                      changeSummary: 'Initial digital checklist authoring'
                    });
                    procQuery.refetch();
                  } catch (err) {
                    setActionError(formatOpError(err));
                  }
                }}
                disabled={mutations.createRevision.isPending}
              >
                {mutations.createRevision.isPending ? 'Creating Revision...' : 'Initialize Rev 1.0 Draft'}
              </OpButton>
            </div>
            {actionError ? <div className="mt-4"><OpError error={actionError} /></div> : null}
          </OpCard>
        </div>
      </OpLayout>
    );
  }

  const sections: OpSection[] = rev.sections ?? [];
  const activeSectionId = selectedSectionId ?? sections[0]?.id ?? null;
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const steps: OpStep[] = (rev.steps ?? []).filter((s) => s.section_id === activeSectionId);

  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionId) return;
    setActionError(null);

    try {
      await mutations.saveStep.mutateAsync({
        sectionId: activeSectionId,
        stepNumber: stepForm.stepNumber,
        stepTitle: stepForm.stepTitle || null,
        stepText: stepForm.stepText,
        stepType: stepForm.stepType,
        roleRequired: stepForm.roleRequired || null,
        isCritical: stepForm.isCritical,
        requiresSignoff: stepForm.requiresSignoff,
        requiresWitness: stepForm.requiresWitness,
        expectedValue: stepForm.expectedValue || null,
        minValue: stepForm.minValue || null,
        maxValue: stepForm.maxValue || null,
        uom: stepForm.uom || null,
        equipmentTag: stepForm.equipmentTag || null,
        branchCondition: stepForm.branchCondition || null,
        branchNextStep: stepForm.branchNextStep || null,
        stepOrder: (steps.length + 1) * 10
      });

      setShowAddStepModal(false);
      setStepForm({
        stepNumber: `${steps.length + 2}.0`,
        stepTitle: '',
        stepText: '',
        stepType: 'action',
        roleRequired: 'Field Operator',
        isCritical: false,
        requiresSignoff: true,
        requiresWitness: false,
        expectedValue: '',
        minValue: '',
        maxValue: '',
        uom: '',
        equipmentTag: '',
        branchCondition: '',
        branchNextStep: ''
      });
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleAddHazard = async (stepId: string) => {
    setActionError(null);
    try {
      await mutations.addHazard.mutateAsync({
        stepId,
        data: {
          hazardLevel: hazardForm.hazardLevel,
          hazardText: hazardForm.hazardText,
          consequenceOfDeviation: hazardForm.consequenceOfDeviation || null,
          correctiveSteps: hazardForm.correctiveSteps || null,
          ppeRequired: hazardForm.ppeRequired.split(',').map((x) => x.trim()).filter(Boolean)
        }
      });
      setShowAddHazardModal(null);
      setHazardForm({
        hazardLevel: 'WARNING',
        hazardText: '',
        consequenceOfDeviation: '',
        correctiveSteps: '',
        ppeRequired: 'Safety Glasses, Nitrile Gloves'
      });
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    setActionError(null);

    try {
      const newSec = await mutations.saveSection.mutateAsync({
        sectionTitle: sectionTitle.trim(),
        sectionKind,
        sectionOrder: (sections.length + 1) * 10
      });
      setShowAddSectionModal(false);
      setSectionTitle('');
      if (newSec && typeof newSec === 'object' && 'id' in newSec) {
        setSelectedSectionId((newSec as { id: string }).id);
      }
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    try {
      await mutations.deleteStep.mutateAsync(stepId);
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <OpLayout current="Editor">
      <div className="space-y-6">
        {/* Header */}
        <OpHeader
          title={`${p?.procedure_number}: ${rev.revision_label} Digital Step Editor`}
          subtitle={`Status: ${rev.status} | Authoring mode for OSHA 1910.119(f) digital execution checklists`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <OpButton variant="secondary" href={`/operating-procedures/${procedureId}`}>
                &larr; Back to Detail
              </OpButton>
              {rev.status === 'Draft' || rev.status === 'Returned' ? (
                <OpButton href={`/operating-procedures/${procedureId}`}>
                  Go to Approvals &rarr;
                </OpButton>
              ) : null}
              <OpButton
                variant="secondary"
                onClick={() => {
                  procQuery.refetch();
                  revQuery.refetch();
                }}
              >
                Refresh
              </OpButton>
            </div>
          }
        />

        {actionError ? <OpError error={actionError} /> : null}

        {/* Workspace Layout */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Section Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <OpCard
              title="Procedure Sections"
              action={
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Add Section
                </button>
              }
            >
              <div className="space-y-1">
                {sections.map((s) => {
                  const isActive = s.id === activeSectionId;
                  const secSteps = (rev.steps ?? []).filter((st) => st.section_id === s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSectionId(s.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-[var(--psm-fg)] hover:bg-[var(--psm-surface-2)]'
                      }`}
                    >
                      <span className="truncate">{s.section_title}</span>
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
                        }`}
                      >
                        {secSteps.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </OpCard>
          </div>

          {/* Steps Main Area */}
          <div className="space-y-6 lg:col-span-3">
            <OpCard
              title={activeSection?.section_title ?? 'Procedure Steps'}
              subtitle={`Kind: ${activeSection?.section_kind ?? 'steps'} | ${steps.length} interactive steps`}
              action={
                <OpButton onClick={() => setShowAddStepModal(true)}>
                  + Add Step
                </OpButton>
              }
            >
              {steps.length === 0 ? (
                <OpEmpty
                  title="No steps in this section"
                  message="Click '+ Add Step' to create your first step, or convert static text into digital checklist items."
                  action={
                    <OpButton onClick={() => setShowAddStepModal(true)}>
                      + Add First Step
                    </OpButton>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {steps.map((st, idx) => (
                    <div
                      key={st.id}
                      className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-xs space-y-3"
                    >
                      {/* Step Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--psm-line)] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-primary">
                            Step {st.step_number}
                          </span>
                          <span className="rounded bg-[var(--psm-surface)] px-2 py-0.5 font-semibold text-[var(--psm-fg)] uppercase tracking-wide text-[10px]">
                            {st.step_type}
                          </span>
                          {st.is_critical ? (
                            <OpBadge tone="danger">Safety-Critical</OpBadge>
                          ) : null}
                          {st.requires_signoff ? (
                            <OpBadge tone="info">Sign-off Required</OpBadge>
                          ) : null}
                          {st.requires_witness ? (
                            <OpBadge tone="warn">2-Person Witness</OpBadge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddHazardModal(st.id)}
                            className="font-semibold text-amber-600 hover:underline"
                          >
                            + Hazard Callout
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(st.id)}
                            className="font-semibold text-danger hover:underline ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Step Text & Instruction */}
                      <div className="text-sm font-medium text-[var(--psm-fg)]">
                        {st.step_text}
                      </div>

                      {/* Expected Value & Safe Operating Limits */}
                      {(st.expected_value || st.min_value !== null || st.max_value !== null || st.equipment_tag) && (
                        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[var(--psm-surface)] p-2.5 text-xs">
                          {st.equipment_tag ? (
                            <div>
                              <span className="text-[var(--psm-muted)]">Equipment:</span>{' '}
                              <span className="font-semibold text-[var(--psm-fg)]">{st.equipment_tag}</span>
                            </div>
                          ) : null}
                          {st.expected_value ? (
                            <div>
                              <span className="text-[var(--psm-muted)]">Target Value:</span>{' '}
                              <span className="font-semibold text-emerald-600">{st.expected_value}</span>
                            </div>
                          ) : null}
                          {(st.min_value !== null || st.max_value !== null) && (
                            <div>
                              <span className="text-[var(--psm-muted)]">Safe Operating Limits (SOL):</span>{' '}
                              <span className="font-mono font-semibold text-primary">
                                [{st.min_value ?? '-∞'} to {st.max_value ?? '+∞'} {st.uom ?? ''}]
                              </span>
                            </div>
                          )}
                          {st.role_required ? (
                            <div>
                              <span className="text-[var(--psm-muted)]">Role:</span>{' '}
                              <span className="font-semibold text-[var(--psm-fg)]">{st.role_required}</span>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Hazard Callouts (CAUTION / WARNING / DANGER) */}
                      {st.hazards?.length ? (
                        <div className="space-y-2 pt-1">
                          {st.hazards.map((hz) => (
                            <div
                              key={hz.id}
                              className={`rounded-lg border p-3 ${
                                hz.hazard_level === 'DANGER'
                                  ? 'border-danger/40 bg-danger/10 text-danger'
                                  : hz.hazard_level === 'WARNING'
                                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                                  : 'border-blue-500/40 bg-blue-500/10 text-blue-700'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                                <span>⚠️ {hz.hazard_level}: {hz.hazard_text}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await mutations.removeHazard.mutateAsync(hz.id);
                                    } catch (err) {
                                      setActionError(formatOpError(err));
                                    }
                                  }}
                                  className="text-[10px] lowercase text-[var(--psm-muted)] hover:text-danger"
                                >
                                  remove
                                </button>
                              </div>
                              {hz.consequence_of_deviation ? (
                                <div className="mt-1.5 text-xs text-[var(--psm-fg)]">
                                  <span className="font-semibold">Consequence of Deviation (OSHA 1910.119(f)(1)(ii)):</span>{' '}
                                  {hz.consequence_of_deviation}
                                </div>
                              ) : null}
                              {hz.corrective_steps ? (
                                <div className="mt-1 text-xs text-[var(--psm-fg)]">
                                  <span className="font-semibold">Steps to Avoid / Correct:</span>{' '}
                                  {hz.corrective_steps}
                                </div>
                              ) : null}
                              {hz.ppe_required?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {hz.ppe_required.map((ppe) => (
                                    <span
                                      key={ppe}
                                      className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--psm-fg)]"
                                    >
                                      🥽 {ppe}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Decision Branching */}
                      {st.branch_condition && (
                        <div className="rounded bg-purple-500/10 p-2 text-purple-700 text-xs font-mono">
                          🔀 IF {st.branch_condition} THEN GOTO STEP {st.branch_next_step ?? 'END'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </OpCard>
          </div>
        </div>

        {/* Modal: Add Step */}
        {showAddStepModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--psm-surface)] p-6 shadow-xl border border-[var(--psm-line)]">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">Add Digital Step</h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Create a digital, step-by-step instruction item for field operators.
              </p>

              <form onSubmit={handleCreateStep} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <OpField label="Step Number" required>
                      <input
                        type="text"
                        required
                        className={opInput}
                        value={stepForm.stepNumber}
                        onChange={(e) => setStepForm({ ...stepForm, stepNumber: e.target.value })}
                      />
                    </OpField>
                  </div>
                  <div>
                    <OpField label="Step Type" required>
                      <select
                        className={opInput}
                        value={stepForm.stepType}
                        onChange={(e) => setStepForm({ ...stepForm, stepType: e.target.value as any })}
                      >
                        <option value="action">Action (Standard task)</option>
                        <option value="check">Check / Inspect</option>
                        <option value="verify">Verify Confirmation</option>
                        <option value="record_value">Record Value (Instrument)</option>
                        <option value="decision">Decision Branch</option>
                        <option value="hold_point">Hold Point (Supervisor sign)</option>
                        <option value="two_person_verify">Two-Person Verification</option>
                        <option value="photo">Photo Evidence</option>
                      </select>
                    </OpField>
                  </div>
                  <div>
                    <OpField label="Assigned Role">
                      <input
                        type="text"
                        className={opInput}
                        placeholder="e.g. Field Operator"
                        value={stepForm.roleRequired}
                        onChange={(e) => setStepForm({ ...stepForm, roleRequired: e.target.value })}
                      />
                    </OpField>
                  </div>
                </div>

                <div>
                  <OpField label="Step Instruction" required helper="Exact action text the operator must perform.">
                    <textarea
                      rows={3}
                      required
                      className={opInput}
                      placeholder="e.g. Slowly open valve HV-102B to 25% open while monitoring downstream pressure gauge PI-104."
                      value={stepForm.stepText}
                      onChange={(e) => setStepForm({ ...stepForm, stepText: e.target.value })}
                    />
                  </OpField>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <OpField label="Equipment Tag">
                      <input
                        type="text"
                        className={opInput}
                        placeholder="HV-102B"
                        value={stepForm.equipmentTag}
                        onChange={(e) => setStepForm({ ...stepForm, equipmentTag: e.target.value })}
                      />
                    </OpField>
                  </div>
                  <div>
                    <OpField label="Min SOL Limit">
                      <input
                        type="number"
                        className={opInput}
                        placeholder="100"
                        value={stepForm.minValue}
                        onChange={(e) => setStepForm({ ...stepForm, minValue: e.target.value })}
                      />
                    </OpField>
                  </div>
                  <div>
                    <OpField label="Max SOL Limit">
                      <input
                        type="number"
                        className={opInput}
                        placeholder="150"
                        value={stepForm.maxValue}
                        onChange={(e) => setStepForm({ ...stepForm, maxValue: e.target.value })}
                      />
                    </OpField>
                  </div>
                  <div>
                    <OpField label="UOM">
                      <input
                        type="text"
                        className={opInput}
                        placeholder="psig, °F, gpm"
                        value={stepForm.uom}
                        onChange={(e) => setStepForm({ ...stepForm, uom: e.target.value })}
                      />
                    </OpField>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--psm-fg)]">
                    <input
                      type="checkbox"
                      checked={stepForm.isCritical}
                      onChange={(e) => setStepForm({ ...stepForm, isCritical: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--psm-line)] text-primary"
                    />
                    Safety-Critical Step
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--psm-fg)]">
                    <input
                      type="checkbox"
                      checked={stepForm.requiresSignoff}
                      onChange={(e) => setStepForm({ ...stepForm, requiresSignoff: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--psm-line)] text-primary"
                    />
                    Requires Operator Sign-off
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--psm-fg)]">
                    <input
                      type="checkbox"
                      checked={stepForm.requiresWitness}
                      onChange={(e) => setStepForm({ ...stepForm, requiresWitness: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--psm-line)] text-primary"
                    />
                    Requires Witness Verification
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                  <OpButton variant="secondary" onClick={() => setShowAddStepModal(false)}>
                    Cancel
                  </OpButton>
                  <OpButton type="submit" disabled={mutations.saveStep.isPending}>
                    {mutations.saveStep.isPending ? 'Saving...' : 'Save Step'}
                  </OpButton>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Modal: Add Hazard Callout */}
        {showAddHazardModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-[var(--psm-surface)] p-6 shadow-xl border border-[var(--psm-line)]">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">Add OSHA Hazard Callout</h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Document consequences of deviation and corrective steps per OSHA 1910.119(f)(1)(ii).
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddHazard(showAddHazardModal);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <OpField label="Hazard Level" required>
                    <select
                      className={opInput}
                      value={hazardForm.hazardLevel}
                      onChange={(e) => setHazardForm({ ...hazardForm, hazardLevel: e.target.value as any })}
                    >
                      <option value="NOTE">NOTE (Operational advice)</option>
                      <option value="CAUTION">CAUTION (Equipment damage risk)</option>
                      <option value="WARNING">WARNING (Personnel injury / moderate release)</option>
                      <option value="DANGER">DANGER (Immediate catastrophic / fatal hazard)</option>
                    </select>
                  </OpField>
                </div>

                <div>
                  <OpField label="Hazard Summary" required>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rapid pressure surge potential during valve stroke"
                      className={opInput}
                      value={hazardForm.hazardText}
                      onChange={(e) => setHazardForm({ ...hazardForm, hazardText: e.target.value })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField
                    label="Consequence of Deviation (1910.119(f)(1)(ii)(A))"
                    helper="What happens if the operator exceeds limits or omits this step?"
                  >
                    <textarea
                      rows={2}
                      className={opInput}
                      placeholder="e.g. Overpressure of reactor vessel leading to rupture disc release and HF aerosol dispersion."
                      value={hazardForm.consequenceOfDeviation}
                      onChange={(e) => setHazardForm({ ...hazardForm, consequenceOfDeviation: e.target.value })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField
                    label="Steps to Avoid / Correct Deviation (1910.119(f)(1)(ii)(B))"
                    helper="Immediate corrective operator action."
                  >
                    <textarea
                      rows={2}
                      className={opInput}
                      placeholder="e.g. Immediately throttle back feed bypass valve and trip emergency quench if temp exceeds 175°F."
                      value={hazardForm.correctiveSteps}
                      onChange={(e) => setHazardForm({ ...hazardForm, correctiveSteps: e.target.value })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField label="Mandatory PPE (Comma-separated)">
                    <input
                      type="text"
                      className={opInput}
                      placeholder="Acid Hood, Nitrile Gloves, Face Shield"
                      value={hazardForm.ppeRequired}
                      onChange={(e) => setHazardForm({ ...hazardForm, ppeRequired: e.target.value })}
                    />
                  </OpField>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                  <OpButton variant="secondary" onClick={() => setShowAddHazardModal(null)}>
                    Cancel
                  </OpButton>
                  <OpButton type="submit" disabled={mutations.addHazard.isPending}>
                    {mutations.addHazard.isPending ? 'Saving...' : 'Add Callout'}
                  </OpButton>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Modal: Add Section */}
        {showAddSectionModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-[var(--psm-surface)] p-6 shadow-xl border border-[var(--psm-line)]">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">Add Procedure Section</h3>
              <form onSubmit={handleAddSection} className="mt-4 space-y-4">
                <div>
                  <OpField label="Section Title" required>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4.0 Pre-Startup Vessel Alignment"
                      className={opInput}
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                    />
                  </OpField>
                </div>
                <div>
                  <OpField label="Section Kind">
                    <select
                      className={opInput}
                      value={sectionKind}
                      onChange={(e) => setSectionKind(e.target.value as any)}
                    >
                      <option value="steps">Operating Steps</option>
                      <option value="purpose">Purpose & Scope</option>
                      <option value="hazards">Safety, Health & Hazards</option>
                      <option value="operating_limits">Safe Operating Limits (SOL)</option>
                      <option value="prerequisites">Prerequisites & Alignments</option>
                      <option value="emergency_response">Emergency Procedures</option>
                    </select>
                  </OpField>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                  <OpButton variant="secondary" onClick={() => setShowAddSectionModal(false)}>
                    Cancel
                  </OpButton>
                  <OpButton type="submit" disabled={mutations.saveSection.isPending}>
                    Add Section
                  </OpButton>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </OpLayout>
  );
}
