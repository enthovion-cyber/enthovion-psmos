'use client';

import { useState } from 'react';
import {
  useOpApprovalRequests,
  useOpLifecycleMutations,
  useOpProcedure
} from '../hooks/useOperatingProcedures';
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
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import type { OpApprovalDecision, OpApprovalRequest, OpApprovalStage } from '../types/operating-procedures.types';

export function OpReviewApprovalTab({ procedureId }: { procedureId: string }) {
  const procQuery = useOpProcedure(procedureId);
  const requestsQuery = useOpApprovalRequests(procedureId);
  const lifecycleMutations = useOpLifecycleMutations(procedureId);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Decision form state
  const [decisionStageId, setDecisionStageId] = useState<string | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [eSignConsent, setESignConsent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Submit form state
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitPriority, setSubmitPriority] = useState('Normal');

  // Publish form state
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [distributionSummary, setDistributionSummary] = useState('Distributed to Operations, Maintenance, and Control Room crews.');

  if (requestsQuery.isLoading || procQuery.isLoading) {
    return <OpLoading rows={6} />;
  }

  const p = procQuery.data;
  const requests = requestsQuery.data ?? [];
  const activeRequest = selectedRequestId
    ? requests.find((r) => r.id === selectedRequestId)
    : requests[0] ?? null;

  const handleRecordDecision = async (decision: OpApprovalDecision['decision']) => {
    if (!activeRequest || !decisionStageId) return;
    if (decision === 'Approved' && !eSignConsent) {
      setActionError('You must check the electronic signature acknowledgment box to certify approval.');
      return;
    }

    setActionError(null);
    try {
      await lifecycleMutations.recordDecision.mutateAsync({
        requestId: activeRequest.id,
        stageId: decisionStageId,
        data: {
          decision,
          comments: decisionComments || null,
          meaningOfSignature:
            'I certify that this operating procedure is technically accurate, safe, and complies with OSHA 1910.119(f).'
        }
      });
      setDecisionStageId(null);
      setDecisionComments('');
      setESignConsent(false);
      procQuery.refetch();
      requestsQuery.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p?.current_revision_id) return;
    setActionError(null);

    try {
      await lifecycleMutations.submitForReview.mutateAsync({
        revisionId: p.current_revision_id,
        data: {
          priority: submitPriority,
          notes: submitNotes || null
        }
      });
      setShowSubmitModal(false);
      setSubmitNotes('');
      procQuery.refetch();
      requestsQuery.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p?.current_revision_id) return;
    setActionError(null);

    try {
      await lifecycleMutations.publishProcedure.mutateAsync({
        revisionId: p.current_revision_id,
        data: {
          effectiveDate,
          distributionSummary,
          acknowledgmentRequired: true
        }
      });
      setShowPublishModal(false);
      procQuery.refetch();
      requestsQuery.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
        <div>
          <h3 className="font-bold text-sm text-[var(--psm-fg)]">
            Lifecycle State: {p?.procedure_status}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
            OSHA 1910.119(f) multi-stage technical review and 21 CFR Part 11 e-signature approval.
          </p>
        </div>

        <div className="flex gap-2">
          {p?.procedure_status === 'Draft' || p?.procedure_status === 'Returned' ? (
            <OpButton onClick={() => setShowSubmitModal(true)}>
              Submit for Formal Review &rarr;
            </OpButton>
          ) : null}

          {p?.procedure_status === 'Approved' ? (
            <OpButton onClick={() => setShowPublishModal(true)}>
              Publish Procedure & Freeze &rarr;
            </OpButton>
          ) : null}
        </div>
      </div>

      {actionError ? <OpError error={actionError} /> : null}

      {/* Requests & Stages View */}
      {requests.length === 0 ? (
        <OpEmpty
          title="No approval workflow initiated"
          message="This procedure is in draft. Complete the digital steps in the editor and click 'Submit for Formal Review' to initiate the approval route."
          action={
            <OpButton onClick={() => setShowSubmitModal(true)}>
              Submit Revision for Review
            </OpButton>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Active Request Overview */}
          {activeRequest ? (
            <OpCard
              title={`${activeRequest.request_number}: ${activeRequest.title}`}
              subtitle={`Submitted ${fmtDateTime(activeRequest.submitted_at)} by ${activeRequest.submitted_by ?? 'System'} | Priority: ${activeRequest.priority}`}
              action={<OpBadge tone={statusTone(activeRequest.status)}>{activeRequest.status}</OpBadge>}
            >
              {/* Visual Multi-Stage Progress Tracker */}
              <div className="py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {(activeRequest.stages ?? []).map((stg: OpApprovalStage) => {
                    const isActive = stg.status === 'Active';
                    const isApproved = stg.status === 'Approved';
                    const isReturned = stg.status === 'Returned';

                    return (
                      <div
                        key={stg.id}
                        className={`rounded-xl border p-3 text-xs transition ${
                          isActive
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : isApproved
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : isReturned
                            ? 'border-danger/40 bg-danger/10'
                            : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase font-bold text-[var(--psm-muted)]">
                            Stage {stg.stage_order}
                          </span>
                          <OpBadge
                            tone={isApproved ? 'good' : isActive ? 'info' : isReturned ? 'danger' : 'neutral'}
                          >
                            {stg.status}
                          </OpBadge>
                        </div>
                        <h4 className="mt-2 font-bold text-[var(--psm-fg)]">{stg.stage_name}</h4>
                        <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Role: {stg.reviewer_role}</p>
                        {stg.completed_at ? (
                          <p className="mt-1 text-[10px] text-emerald-600 font-semibold">
                            Completed {fmtDate(stg.completed_at)}
                          </p>
                        ) : stg.due_at ? (
                          <p className="mt-1 text-[10px] text-[var(--psm-muted)]">
                            Due: {fmtDate(stg.due_at)}
                          </p>
                        ) : null}

                        {/* If this stage is Active, allow decision */}
                        {isActive && activeRequest.status === 'In Review' ? (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setDecisionStageId(stg.id)}
                              className="w-full rounded bg-primary py-1.5 text-center text-xs font-semibold text-white hover:bg-primary/90"
                            >
                              Sign & Decide Stage &rarr;
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Electronic Signature & Decision Drawer */}
              {decisionStageId ? (
                <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-2">
                    <h4 className="text-sm font-bold text-[var(--psm-fg)]">
                      Electronic Signature & Decision Certification
                    </h4>
                    <button
                      type="button"
                      onClick={() => setDecisionStageId(null)}
                      className="text-xs text-[var(--psm-muted)] hover:text-[var(--psm-fg)]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <OpField label="Reviewer Comments & Technical Findings">
                      <textarea
                        rows={3}
                        className={opInput}
                        placeholder="Document any deviations, technical verifications, or conditions of approval..."
                        value={decisionComments}
                        onChange={(e) => setDecisionComments(e.target.value)}
                      />
                    </OpField>
                  </div>

                  <div className="rounded-lg bg-[var(--psm-surface)] p-3 text-xs border border-[var(--psm-line)]">
                    <label className="flex items-start gap-2.5 font-medium text-[var(--psm-fg)]">
                      <input
                        type="checkbox"
                        checked={eSignConsent}
                        onChange={(e) => setESignConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[var(--psm-line)] text-primary"
                      />
                      <span>
                        <strong className="block text-primary">21 CFR Part 11 Electronic Signature Attestation:</strong>
                        "I hereby certify that I have conducted a technical review of this procedure against Process Safety Information (PSI), safe operating limits, and engineering standards. I confirm this document is accurate and safe for operational execution."
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <OpButton
                      variant="danger"
                      onClick={() => handleRecordDecision('Returned for Revision')}
                      disabled={lifecycleMutations.recordDecision.isPending}
                    >
                      Return for Revision
                    </OpButton>
                    <OpButton
                      variant="primary"
                      onClick={() => handleRecordDecision('Approved')}
                      disabled={lifecycleMutations.recordDecision.isPending}
                    >
                      {lifecycleMutations.recordDecision.isPending ? 'Signing...' : 'Approve & Affix E-Signature'}
                    </OpButton>
                  </div>
                </div>
              ) : null}

              {/* Recorded Decisions History */}
              {activeRequest.decisions?.length ? (
                <div className="mt-6 border-t border-[var(--psm-line)] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                    Sign-off Audit Trail
                  </h4>
                  <div className="mt-3 divide-y divide-[var(--psm-line)]">
                    {activeRequest.decisions.map((dec: OpApprovalDecision) => (
                      <div key={dec.id} className="py-2.5 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[var(--psm-fg)]">
                            {dec.decided_by ?? 'Authorized Reviewer'}
                          </span>{' '}
                          &mdash; <span className="font-semibold text-emerald-600">{dec.decision}</span>
                          {dec.decision_comments ? (
                            <p className="mt-0.5 text-[var(--psm-muted)] italic">
                              "{dec.decision_comments}"
                            </p>
                          ) : null}
                          <p className="text-[10px] text-[var(--psm-muted)] font-mono">
                            Sig Hash: {dec.signature_hash?.slice(0, 16)}...
                          </p>
                        </div>
                        <div className="text-[var(--psm-muted)]">{fmtDateTime(dec.decided_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </OpCard>
          ) : null}
        </div>
      )}

      {/* Modal: Submit for Review */}
      {showSubmitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--psm-surface)] p-6 shadow-xl border border-[var(--psm-line)]">
            <h3 className="text-lg font-bold text-[var(--psm-fg)]">Submit for Formal Review</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Routes this revision to technical SMEs, operations supervisors, and PSM coordinators for approval.
            </p>
            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div>
                <OpField label="Workflow Priority">
                  <select
                    className={opInput}
                    value={submitPriority}
                    onChange={(e) => setSubmitPriority(e.target.value)}
                  >
                    <option value="Normal">Normal Review (5 business days)</option>
                    <option value="High">High Priority (2 business days)</option>
                    <option value="Urgent">Urgent / Emergency MOC (24 hours)</option>
                  </select>
                </OpField>
              </div>

              <div>
                <OpField label="Submission Notes & Scope of Changes">
                  <textarea
                    rows={3}
                    className={opInput}
                    placeholder="Describe specific changes or reasons for this review cycle..."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                  />
                </OpField>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                <OpButton variant="secondary" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </OpButton>
                <OpButton type="submit" disabled={lifecycleMutations.submitForReview.isPending}>
                  {lifecycleMutations.submitForReview.isPending ? 'Submitting...' : 'Submit Workflow'}
                </OpButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal: Publish Procedure */}
      {showPublishModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--psm-surface)] p-6 shadow-xl border border-[var(--psm-line)]">
            <h3 className="text-lg font-bold text-[var(--psm-fg)]">Publish & Freeze Procedure</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Freezes revision content into an official, active operating document. All prior revisions will be superseded.
            </p>
            <form onSubmit={handlePublish} className="mt-4 space-y-4">
              <div>
                <OpField label="Effective Date" required>
                  <input
                    type="date"
                    required
                    className={opInput}
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </OpField>
              </div>

              <div>
                <OpField label="Distribution Summary & Workforce Scope">
                  <textarea
                    rows={3}
                    className={opInput}
                    value={distributionSummary}
                    onChange={(e) => setDistributionSummary(e.target.value)}
                  />
                </OpField>
              </div>

              <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700">
                ⚠️ Publishing will lock all steps. Further modifications will require creating a new revision.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                <OpButton variant="secondary" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </OpButton>
                <OpButton type="submit" disabled={lifecycleMutations.publishProcedure.isPending}>
                  {lifecycleMutations.publishProcedure.isPending ? 'Publishing...' : 'Publish & Activate'}
                </OpButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
