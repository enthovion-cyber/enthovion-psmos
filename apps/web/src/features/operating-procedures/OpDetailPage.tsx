'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useOpAccessLog,
  useOpAcknowledgmentMutations,
  useOpChangeFlagMutations,
  useOpExecutionMutations,
  useOpHistory,
  useOpLinkedRecordMutations,
  useOpLinkedRecords,
  useOpMutations,
  useOpProcedure,
  useOpProcedureAckStats,
  useOpProcedureCertification,
  useOpProcedureChangeFlags,
  useOpProcedureExecutions,
  useOpRevisions
} from './hooks/useOperatingProcedures';
import { OpReviewApprovalTab } from './lifecycle/OpReviewApprovalTab';
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
  fmtDateTime,
  formatOpError,
  opInput,
  statusTone
} from './shared/OpUi';
import type {
  OpAccessLog,
  OpCertificationReview,
  OpChangeFlag,
  OpExecution,
  OpHistoryEvent,
  OpLinkedRecord,
  OpRevision,
  OpScopeRow
} from './types/operating-procedures.types';

export function OpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const procedureId = String(params.procedureId);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'revisions' | 'approval' | 'certification' | 'executions' | 'change-flags' | 'linked-records' | 'acknowledgments' | 'scopes' | 'history' | 'access-log'
  >('overview');
  const [newScopeType, setNewScopeType] = useState('Equipment');
  const [newScopeLabel, setNewScopeLabel] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStartRunOpen, setIsStartRunOpen] = useState(false);
  const [runMode, setRunMode] = useState('Normal');
  const [runShift, setRunShift] = useState('Day Shift');

  // New Link Record Modal state
  const [isLinkRecordOpen, setIsLinkRecordOpen] = useState(false);
  const [linkRecordType, setLinkRecordType] = useState<'PSI_SOL' | 'PSI_CHEMICAL' | 'PSI_DRAWING' | 'EQUIPMENT' | 'MOC' | 'HAZOP_REC' | 'INCIDENT_CAPA'>('PSI_SOL');
  const [linkRecordRef, setLinkRecordRef] = useState('');
  const [linkRecordTitle, setLinkRecordTitle] = useState('');

  // New Change Flag Modal state
  const [isCreateFlagOpen, setIsCreateFlagOpen] = useState(false);
  const [flagSourceType, setFlagSourceType] = useState<'MOC' | 'PSI' | 'HAZOP' | 'LOPA' | 'INCIDENT' | 'AUDIT' | 'MANUAL'>('MOC');
  const [flagSourceRef, setFlagSourceRef] = useState('');
  const [flagPriority, setFlagPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [flagReason, setFlagReason] = useState('');

  const query = useOpProcedure(procedureId);
  const revisionsQuery = useOpRevisions(procedureId, activeTab === 'revisions');
  const certQuery = useOpProcedureCertification(procedureId, activeTab === 'certification');
  const executionsQuery = useOpProcedureExecutions(procedureId, activeTab === 'executions' ? {} : undefined);
  const changeFlagsQuery = useOpProcedureChangeFlags(procedureId, activeTab === 'change-flags' ? {} : undefined);
  const linkedRecordsQuery = useOpLinkedRecords(procedureId, activeTab === 'linked-records' ? undefined : undefined);
  const ackStatsQuery = useOpProcedureAckStats(procedureId);
  const historyQuery = useOpHistory(procedureId, activeTab === 'history');
  const accessLogQuery = useOpAccessLog(procedureId, activeTab === 'access-log');

  const mutations = useOpMutations(procedureId);
  const execMutations = useOpExecutionMutations();
  const flagMutations = useOpChangeFlagMutations(procedureId);
  const linkMutations = useOpLinkedRecordMutations(procedureId);

  if (query.isLoading) {
    return (
      <OpLayout current="Procedure Detail">
        <OpLoading rows={8} />
      </OpLayout>
    );
  }

  if (query.isError) {
    return (
      <OpLayout current="Procedure Detail">
        <OpError error={query.error} onRetry={() => query.refetch()} />
      </OpLayout>
    );
  }

  const p = query.data;
  if (!p) return null;

  const handleLockToggle = async () => {
    setActionError(null);
    try {
      if (p.locked) {
        await mutations.unlock.mutateAsync({});
      } else {
        await mutations.lock.mutateAsync({ reason: 'Locked for management review' });
      }
      query.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleArchive = async () => {
    const reason = prompt('Please enter the reason for archiving this procedure:');
    if (!reason) return;
    setActionError(null);
    try {
      await mutations.archive.mutateAsync({ reason });
      query.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleReactivate = async () => {
    setActionError(null);
    try {
      await mutations.reactivate.mutateAsync({ reason: 'Reactivated from archive' });
      query.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleAddScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScopeLabel.trim()) return;
    setActionError(null);
    try {
      await mutations.addScope.mutateAsync({
        scopeType: newScopeType,
        scopeLabel: newScopeLabel.trim()
      });
      setNewScopeLabel('');
      query.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleRemoveScope = async (scopeId: string) => {
    setActionError(null);
    try {
      await mutations.removeScope.mutateAsync({ scopeId, reason: 'Scope removed by user' });
      query.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <OpLayout current={p.procedure_number}>
      <div className="space-y-6">
        {/* Header */}
        <OpHeader
          title={`${p.procedure_number}: ${p.title}`}
          subtitle={`${p.procedure_type_code} | OSHA Reference: ${p.regulatory_basis.join(', ') || '1910.119(f)'}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <OpButton href={`/operating-procedures/${procedureId}/editor`}>
                Open Digital Step Editor
              </OpButton>
              <OpButton variant="secondary" onClick={() => query.refetch()}>
                Refresh
              </OpButton>
              {p.locked ? (
                <OpButton variant="secondary" onClick={handleLockToggle}>
                  Unlock Procedure
                </OpButton>
              ) : (
                <OpButton variant="secondary" onClick={handleLockToggle}>
                  Lock
                </OpButton>
              )}
              {p.archived_at ? (
                <OpButton variant="secondary" onClick={handleReactivate}>
                  Reactivate
                </OpButton>
              ) : (
                <OpButton variant="danger" onClick={handleArchive}>
                  Archive
                </OpButton>
              )}
            </div>
          }
        />

        {actionError ? <OpError error={actionError} /> : null}

        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-muted)]">
            <span>Status:</span>
            <OpBadge tone={statusTone(p.procedure_status)}>{p.procedure_status}</OpBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-muted)]">
            <span>Criticality:</span>
            <OpBadge tone={criticalityTone(p.criticality)}>{p.criticality}</OpBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-muted)]">
            <span>Annual Cert:</span>
            <OpBadge tone={statusTone(p.certification_status)}>{p.certification_status}</OpBadge>
          </div>
          {p.locked ? (
            <OpBadge tone="danger">Locked: {p.lock_reason || 'Administrative Lock'}</OpBadge>
          ) : null}
          {p.is_safe_work_practice ? <OpBadge tone="info">Safe Work Practice (SWP)</OpBadge> : null}
          {p.is_temporary ? (
            <OpBadge tone="warn">Temporary (Expires: {fmtDate(p.temporary_expires_at)})</OpBadge>
          ) : null}
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[var(--psm-line)] text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Overview & Scope
          </button>
          <button
            onClick={() => setActiveTab('revisions')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'revisions'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Revisions & Digital Steps
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'approval'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Review & Approval Workflow
          </button>
          <button
            onClick={() => setActiveTab('certification')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'certification'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Annual Certification (1910.119(f)(3))
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'executions'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Executions & Runs ({executionsQuery.data?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('change-flags')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'change-flags'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Change Flags ({changeFlagsQuery.data?.filter(f => f.status === 'Open').length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('linked-records')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'linked-records'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Linked Records (PSI / MOC)
          </button>
          <button
            onClick={() => setActiveTab('acknowledgments')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'acknowledgments'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Read & Understand ({ackStatsQuery.data?.compliancePercentage ?? 100}%)
          </button>
          <button
            onClick={() => setActiveTab('scopes')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'scopes'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Applicability Scopes ({p.scopes?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            History & Audit Events
          </button>
          <button
            onClick={() => setActiveTab('access-log')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'access-log'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Right-to-Know Access Log
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <OpCard title="Purpose & Operational Intent">
                <p className="text-sm text-[var(--psm-fg)]">
                  {p.purpose || <span className="italic text-[var(--psm-muted)]">No purpose documented yet.</span>}
                </p>
              </OpCard>

              <OpCard title="Operating Boundaries & Scope Summary">
                <p className="text-sm text-[var(--psm-fg)]">
                  {p.scope_summary || (
                    <span className="italic text-[var(--psm-muted)]">No boundary limits documented yet.</span>
                  )}
                </p>
              </OpCard>

              <OpCard title="Roadmap & Connected Phase Modules">
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border border-[var(--psm-line)] p-3">
                    <span className="font-semibold text-primary">Phase 2: Authoring</span>
                    <p className="mt-1 text-[var(--psm-muted)]">Digital step builder, callouts & branch logic.</p>
                  </div>
                  <div className="rounded-lg border border-[var(--psm-line)] p-3">
                    <span className="font-semibold text-primary">Phase 3: Lifecycle</span>
                    <p className="mt-1 text-[var(--psm-muted)]">Workflow engine, reviews & e-signatures.</p>
                  </div>
                  <div className="rounded-lg border border-[var(--psm-line)] p-3">
                    <span className="font-semibold text-primary">Phase 4: Annual Cert</span>
                    <p className="mt-1 text-[var(--psm-muted)]">OSHA annual recertification & SME log.</p>
                  </div>
                  <div className="rounded-lg border border-[var(--psm-line)] p-3">
                    <span className="font-semibold text-primary">Phase 5: Execution</span>
                    <p className="mt-1 text-[var(--psm-muted)]">Mobile checklists, hold points & live limits.</p>
                  </div>
                </div>
              </OpCard>
            </div>

            {/* Sidebar metadata */}
            <div className="space-y-6">
              <OpCard title="Compliance Details">
                <dl className="space-y-3 text-xs">
                  <div>
                    <dt className="text-[var(--psm-muted)]">Annual Review Cycle</dt>
                    <dd className="font-semibold text-[var(--psm-fg)]">{p.review_frequency_months} Months</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--psm-muted)]">Next Annual Cert Due</dt>
                    <dd className="font-semibold text-[var(--psm-fg)]">
                      {fmtDate(p.next_certification_due)}
                      {p.days_to_certification_due !== null ? (
                        <span className="ml-1 text-[var(--psm-muted)]">
                          ({p.days_to_certification_due > 0 ? `${p.days_to_certification_due} days left` : `${Math.abs(p.days_to_certification_due)} days overdue`})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--psm-muted)]">Operating Mode</dt>
                    <dd className="font-semibold text-[var(--psm-fg)]">{p.operating_mode ?? 'Normal'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--psm-muted)]">Procedure Owner</dt>
                    <dd className="font-semibold text-[var(--psm-fg)]">{p.owner_user_id ?? 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--psm-muted)]">Current Revision</dt>
                    <dd className="font-mono font-semibold text-[var(--psm-fg)]">{p.current_revision_label ?? 'Draft / Unapproved'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--psm-muted)]">Last Certified Date</dt>
                    <dd className="font-semibold text-[var(--psm-fg)]">{fmtDate(p.last_certified_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--psm-muted)]">Effective Date</dt>
                    <dd className="font-semibold text-[var(--psm-fg)]">{fmtDate(p.effective_date)}</dd>
                  </div>
                </dl>
              </OpCard>
            </div>
          </div>
        )}

        {/* Revisions & Content Tab */}
        {activeTab === 'revisions' && (
          <div className="space-y-6">
            <OpCard
              title="Procedure Revisions & Digital Steps"
              subtitle="Formal version control and lifecycle management under OSHA 1910.119(f)."
              action={
                <OpButton href={`/operating-procedures/${procedureId}/editor`}>
                  Open Digital Step Editor &rarr;
                </OpButton>
              }
            >
              {revisionsQuery.isLoading ? (
                <OpLoading rows={4} />
              ) : revisionsQuery.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                        <th className="py-2.5 pr-4">Revision</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 pr-4">Reason</th>
                        <th className="py-2.5 pr-4">Change Summary</th>
                        <th className="py-2.5 pr-4">Effective Date</th>
                        <th className="py-2.5 pr-4">Author</th>
                        <th className="py-2.5 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--psm-line)]">
                      {revisionsQuery.data.map((r: OpRevision) => (
                        <tr key={r.id} className="hover:bg-[var(--psm-surface-2)]">
                          <td className="py-3 pr-4 font-mono font-bold text-primary">
                            {r.revision_label}
                          </td>
                          <td className="py-3 pr-4">
                            <OpBadge tone={statusTone(r.status)}>{r.status}</OpBadge>
                          </td>
                          <td className="py-3 pr-4 text-[var(--psm-muted)]">{r.change_reason}</td>
                          <td className="py-3 pr-4 text-[var(--psm-fg)]">
                            {r.change_summary || 'No summary provided.'}
                          </td>
                          <td className="py-3 pr-4 text-[var(--psm-muted)]">
                            {fmtDate(r.effective_date)}
                          </td>
                          <td className="py-3 pr-4 text-[var(--psm-muted)]">
                            {r.created_by ?? 'System'}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <Link
                              href={`/operating-procedures/${procedureId}/editor`}
                              className="rounded px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                            >
                              Edit Steps
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <OpEmpty
                  title="No revisions found"
                  message="Initialize a new draft revision to start creating digital steps."
                  action={
                    <OpButton href={`/operating-procedures/${procedureId}/editor`}>
                      Open Step Editor
                    </OpButton>
                  }
                />
              )}
            </OpCard>
          </div>
        )}

        {/* Review & Approval Tab */}
        {activeTab === 'approval' && (
          <OpReviewApprovalTab procedureId={procedureId} />
        )}

        {/* Annual Certification Tab */}
        {activeTab === 'certification' && (
          <div className="space-y-6">
            <OpCard
              title="OSHA 1910.119(f)(3) Annual Certification Record"
              subtitle="Annual SME review verifying that this procedure reflects current plant operating practice and safe operating limits."
              action={
                <OpButton href="/operating-procedures/certification">
                  Open Annual Certification Hub &rarr;
                </OpButton>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pb-4 border-b border-[var(--psm-line)]">
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Current Cert Status</span>
                  <div className="mt-1">
                    <OpBadge tone={statusTone(p.certification_status)}>{p.certification_status}</OpBadge>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Last Certified Date</span>
                  <div className="mt-1 font-bold text-sm text-[var(--psm-fg)]">
                    {fmtDate(p.last_certified_at)}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Next Annual Due Date</span>
                  <div className="mt-1 font-bold text-sm text-primary">
                    {fmtDate(p.next_certification_due)}
                  </div>
                </div>
              </div>

              {/* Past Review Records */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] mb-3">
                  Historical Annual SME Reviews
                </h4>
                {certQuery.isLoading ? (
                  <OpLoading rows={3} />
                ) : certQuery.data?.reviews?.length ? (
                  <div className="divide-y divide-[var(--psm-line)]">
                    {certQuery.data.reviews.map((rev: OpCertificationReview) => (
                      <div key={rev.id} className="py-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-600">{rev.outcome}</span>
                          <span className="text-[var(--psm-muted)]">{fmtDateTime(rev.certified_at)}</span>
                        </div>
                        {rev.findings_summary ? (
                          <p className="text-[var(--psm-fg)] italic">"{rev.findings_summary}"</p>
                        ) : null}
                        <div className="text-[10px] text-[var(--psm-muted)]">
                          Reviewer: {rev.reviewer_user_id} | Signature Attestation: OSHA 1910.119(f)(3) Compliant
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-xs text-[var(--psm-muted)]">
                    No annual certification reviews recorded yet. Visit the Annual Certification Hub to perform the review.
                  </p>
                )}
              </div>
            </OpCard>
          </div>
        )}

        {/* Executions Tab */}
        {activeTab === 'executions' && (
          <div className="space-y-6">
            <OpCard
              title="Digital Procedure Execution Runs"
              subtitle="All historical and active in-field digital checklists recorded against this procedure."
              action={
                <OpButton variant="primary" onClick={() => setIsStartRunOpen(true)}>
                  + Launch Digital Execution
                </OpButton>
              }
            >
              {executionsQuery.isLoading ? (
                <OpLoading rows={3} />
              ) : executionsQuery.data?.length ? (
                <div className="divide-y divide-[var(--psm-line)]">
                  {executionsQuery.data.map((run: OpExecution) => {
                    const pct = run.total_steps > 0 ? Math.round((run.completed_steps / run.total_steps) * 100) : 0;
                    return (
                      <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-primary">{run.execution_number}</span>
                            <OpBadge tone={run.status === 'Completed' ? 'good' : run.status === 'In Progress' ? 'warn' : 'neutral'}>
                              {run.status}
                            </OpBadge>
                            <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--psm-muted)]">
                              {run.execution_mode}
                            </span>
                            {run.deviated_steps > 0 && (
                              <OpBadge tone="danger">{run.deviated_steps} SOL Deviation(s)</OpBadge>
                            )}
                          </div>
                          <p className="text-xs text-[var(--psm-muted)]">
                            Shift: <span className="font-medium text-[var(--psm-fg)]">{run.shift || 'Day'}</span> &bull;
                            Started: {fmtDateTime(run.started_at)} {run.completed_at ? `&bull; Completed: ${fmtDateTime(run.completed_at)}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-medium text-[var(--psm-muted)]">
                              {run.completed_steps} / {run.total_steps} steps ({pct}%)
                            </div>
                            <div className="mt-1 h-2 w-28 overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                              <div
                                className={`h-full ${
                                  run.deviated_steps > 0 ? 'bg-amber-500' : run.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <OpButton href={`/operating-procedures/execute/${run.id}`} variant="secondary">
                            {run.status === 'In Progress' ? 'Resume Run' : 'View Run'}
                          </OpButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <OpEmpty
                  title="No Executions Recorded"
                  message="This procedure has not been digitally executed in the field yet. Launch an execution run to track real-time operator sign-offs."
                  action={
                    <OpButton variant="primary" onClick={() => setIsStartRunOpen(true)}>
                      Launch First Execution Run
                    </OpButton>
                  }
                />
              )}
            </OpCard>

            {/* Launch Run Modal */}
            {isStartRunOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
                  <h3 className="text-base font-bold text-[var(--psm-fg)]">
                    Launch Run: {p.procedure_number}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--psm-muted)]">
                    Create a new live digital execution snapshot for {p.title}.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setActionError(null);
                      try {
                        const newRun = await execMutations.startExecution.mutateAsync({
                          procedureId,
                          data: {
                            executionMode: runMode,
                            shift: runShift
                          }
                        });
                        setIsStartRunOpen(false);
                        router.push(`/operating-procedures/execute/${newRun.id}`);
                      } catch (err) {
                        setActionError(formatOpError(err));
                      }
                    }}
                    className="mt-4 space-y-4"
                  >
                    <OpField label="Execution Mode">
                      <select className={opInput} value={runMode} onChange={(e) => setRunMode(e.target.value)}>
                        <option value="Normal">Normal Operation</option>
                        <option value="Startup">Unit Startup</option>
                        <option value="Shutdown">Normal Shutdown</option>
                        <option value="Emergency Shutdown">Emergency Shutdown</option>
                        <option value="Temporary">Temporary Mode</option>
                        <option value="Training">Training / Dry Run</option>
                      </select>
                    </OpField>

                    <OpField label="Shift">
                      <select className={opInput} value={runShift} onChange={(e) => setRunShift(e.target.value)}>
                        <option value="Day Shift">Day Shift</option>
                        <option value="Night Shift">Night Shift</option>
                        <option value="Swing Shift">Swing Shift</option>
                      </select>
                    </OpField>

                    <div className="flex justify-end gap-2 pt-2">
                      <OpButton variant="secondary" onClick={() => setIsStartRunOpen(false)}>
                        Cancel
                      </OpButton>
                      <OpButton variant="primary" type="submit" disabled={execMutations.startExecution.isPending}>
                        {execMutations.startExecution.isPending ? 'Starting...' : 'Start Execution Run'}
                      </OpButton>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Change Flags Tab */}
        {activeTab === 'change-flags' && (
          <div className="space-y-6">
            <OpCard
              title="Procedure Change Flags"
              subtitle="Upstream changes from MOC, PSI safe operating limits, HAZOP/LOPA recommendations, or incident findings requiring updates to this procedure."
              action={
                <OpButton variant="primary" onClick={() => setIsCreateFlagOpen(true)}>
                  + Raise Change Flag
                </OpButton>
              }
            >
              {changeFlagsQuery.isLoading ? (
                <OpLoading rows={3} />
              ) : changeFlagsQuery.data?.length ? (
                <div className="divide-y divide-[var(--psm-line)]">
                  {changeFlagsQuery.data.map((flag: OpChangeFlag) => {
                    const isOpen = flag.status === 'Open' || flag.status === 'In Progress';
                    return (
                      <div key={flag.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              {flag.source_type}: {flag.source_reference}
                            </span>
                            <OpBadge tone={criticalityTone(flag.priority)}>{flag.priority}</OpBadge>
                            <OpBadge tone={statusTone(flag.status)}>{flag.status}</OpBadge>
                            {flag.blocks_moc_closure && isOpen && (
                              <span className="rounded bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger border border-danger/20">
                                Blocks MOC Closure
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[var(--psm-fg)]">{flag.reason}</p>
                          {flag.description && <p className="text-xs text-[var(--psm-muted)]">{flag.description}</p>}
                          <div className="text-[11px] text-[var(--psm-muted)]">
                            Flagged at {fmtDateTime(flag.created_at)}
                            {flag.resolution_notes && ` &bull; Resolution: ${flag.resolution_notes}`}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const notes = prompt('Enter resolution notes:');
                                if (!notes) return;
                                await flagMutations.resolveChangeFlag.mutateAsync({
                                  flagId: flag.id,
                                  data: { resolutionNotes: notes }
                                });
                                changeFlagsQuery.refetch();
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const reason = prompt('Enter dismissal reason:');
                                if (!reason) return;
                                await flagMutations.dismissChangeFlag.mutateAsync({
                                  flagId: flag.id,
                                  data: { dismissalReason: reason }
                                });
                                changeFlagsQuery.refetch();
                              }}
                              className="text-xs font-semibold text-[var(--psm-muted)] hover:text-danger"
                            >
                              Dismiss...
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <OpEmpty
                  title="No Change Flags"
                  message="This operating procedure currently has no open change flags from MOC, PSI, HAZOP, or Incident modules."
                  action={
                    <OpButton variant="secondary" onClick={() => setIsCreateFlagOpen(true)}>
                      Raise Change Flag
                    </OpButton>
                  }
                />
              )}
            </OpCard>

            {/* Raise Flag Modal */}
            {isCreateFlagOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
                  <h3 className="text-base font-bold text-[var(--psm-fg)]">Raise Procedure Change Flag</h3>
                  <p className="mt-1 text-xs text-[var(--psm-muted)]">
                    Flag this procedure for revision triggered by an upstream safety change.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setActionError(null);
                      try {
                        await flagMutations.createChangeFlag.mutateAsync({
                          procedureId,
                          data: {
                            sourceType: flagSourceType,
                            sourceId: flagSourceRef || crypto.randomUUID(),
                            sourceReference: flagSourceRef || `${flagSourceType}-REQ`,
                            priority: flagPriority,
                            reason: flagReason,
                            blocksMocClosure: flagSourceType === 'MOC'
                          }
                        });
                        setIsCreateFlagOpen(false);
                        setFlagReason('');
                        setFlagSourceRef('');
                        changeFlagsQuery.refetch();
                      } catch (err) {
                        setActionError(formatOpError(err));
                      }
                    }}
                    className="mt-4 space-y-4"
                  >
                    <OpField label="Source Module">
                      <select
                        className={opInput}
                        value={flagSourceType}
                        onChange={(e) => setFlagSourceType(e.target.value as any)}
                      >
                        <option value="MOC">Management of Change (MOC)</option>
                        <option value="PSI">Process Safety Information (SOL)</option>
                        <option value="HAZOP">HAZOP / PHA Recommendation</option>
                        <option value="LOPA">LOPA Action</option>
                        <option value="INCIDENT">Incident CAPA</option>
                        <option value="MANUAL">Engineering Manual Request</option>
                      </select>
                    </OpField>

                    <OpField label="Source Reference #" required>
                      <input
                        type="text"
                        className={opInput}
                        value={flagSourceRef}
                        onChange={(e) => setFlagSourceRef(e.target.value)}
                        placeholder="e.g. MOC-2026-0042 or HAZOP-REC-012"
                        required
                      />
                    </OpField>

                    <OpField label="Priority">
                      <select
                        className={opInput}
                        value={flagPriority}
                        onChange={(e) => setFlagPriority(e.target.value as any)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical Safety</option>
                      </select>
                    </OpField>

                    <OpField label="Reason / Required Update" required>
                      <textarea
                        rows={3}
                        className={opInput}
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="Describe the required revision to steps, operating limits, or safeguards..."
                        required
                      />
                    </OpField>

                    <div className="flex justify-end gap-2 pt-2">
                      <OpButton variant="secondary" onClick={() => setIsCreateFlagOpen(false)}>
                        Cancel
                      </OpButton>
                      <OpButton variant="primary" type="submit" disabled={flagMutations.createChangeFlag.isPending}>
                        {flagMutations.createChangeFlag.isPending ? 'Flagging...' : 'Save Change Flag'}
                      </OpButton>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Linked Records Tab */}
        {activeTab === 'linked-records' && (
          <div className="space-y-6">
            <OpCard
              title="Process Safety Information & Upstream Links"
              subtitle="Direct database connections to PSI Safe Operating Limits (SOL), chemical SDS, P&IDs, equipment records, and MOCs."
              action={
                <OpButton variant="primary" onClick={() => setIsLinkRecordOpen(true)}>
                  + Link Record
                </OpButton>
              }
            >
              {linkedRecordsQuery.isLoading ? (
                <OpLoading rows={3} />
              ) : linkedRecordsQuery.data?.length ? (
                <div className="divide-y divide-[var(--psm-line)]">
                  {linkedRecordsQuery.data.map((rec: OpLinkedRecord) => (
                    <div key={rec.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-bold text-[var(--psm-fg)] border border-[var(--psm-line)]">
                            {rec.record_type.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-xs font-semibold text-primary">{rec.record_reference}</span>
                          <OpBadge tone={rec.sync_status === 'In Sync' ? 'good' : 'warn'}>
                            {rec.sync_status}
                          </OpBadge>
                        </div>
                        <p className="text-sm font-semibold text-[var(--psm-fg)]">{rec.record_title}</p>
                        <div className="text-[11px] text-[var(--psm-muted)]">Linked at {fmtDateTime(rec.created_at)}</div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Unlink record ${rec.record_reference}?`)) return;
                          await linkMutations.unlinkRecord.mutateAsync(rec.id);
                          linkedRecordsQuery.refetch();
                        }}
                        className="rounded px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                      >
                        Unlink
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <OpEmpty
                  title="No Linked Records"
                  message="Connect this procedure to Process Safety Information (PSI) Safe Operating Limits, equipment, chemicals, or drawings to guarantee live synchronization."
                  action={
                    <OpButton variant="secondary" onClick={() => setIsLinkRecordOpen(true)}>
                      Link Record
                    </OpButton>
                  }
                />
              )}
            </OpCard>

            {/* Link Record Modal */}
            {isLinkRecordOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
                  <h3 className="text-base font-bold text-[var(--psm-fg)]">Link Process Safety Record</h3>
                  <p className="mt-1 text-xs text-[var(--psm-muted)]">
                    Create a verified database relation to Process Safety Information.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setActionError(null);
                      try {
                        await linkMutations.linkRecord.mutateAsync({
                          recordType: linkRecordType,
                          recordId: linkRecordRef,
                          recordReference: linkRecordRef,
                          recordTitle: linkRecordTitle
                        });
                        setIsLinkRecordOpen(false);
                        setLinkRecordRef('');
                        setLinkRecordTitle('');
                        linkedRecordsQuery.refetch();
                      } catch (err) {
                        setActionError(formatOpError(err));
                      }
                    }}
                    className="mt-4 space-y-4"
                  >
                    <OpField label="Record Type">
                      <select
                        className={opInput}
                        value={linkRecordType}
                        onChange={(e) => setLinkRecordType(e.target.value as any)}
                      >
                        <option value="PSI_SOL">PSI Safe Operating Limit (SOL)</option>
                        <option value="PSI_CHEMICAL">PSI Chemical / SDS</option>
                        <option value="PSI_DRAWING">PSI P&ID Drawing</option>
                        <option value="EQUIPMENT">Mechanical Integrity Equipment</option>
                        <option value="MOC">Management of Change (MOC)</option>
                        <option value="HAZOP_REC">HAZOP Recommendation</option>
                        <option value="INCIDENT_CAPA">Incident CAPA Action</option>
                      </select>
                    </OpField>

                    <OpField label="Record Reference / Identifier" required>
                      <input
                        type="text"
                        className={opInput}
                        value={linkRecordRef}
                        onChange={(e) => setLinkRecordRef(e.target.value)}
                        placeholder="e.g. SOL-TK-101-PRESS or PID-1002"
                        required
                      />
                    </OpField>

                    <OpField label="Record Title / Description" required>
                      <input
                        type="text"
                        className={opInput}
                        value={linkRecordTitle}
                        onChange={(e) => setLinkRecordTitle(e.target.value)}
                        placeholder="e.g. Primary Storage Tank Pressure Boundary"
                        required
                      />
                    </OpField>

                    <div className="flex justify-end gap-2 pt-2">
                      <OpButton variant="secondary" onClick={() => setIsLinkRecordOpen(false)}>
                        Cancel
                      </OpButton>
                      <OpButton variant="primary" type="submit" disabled={linkMutations.linkRecord.isPending}>
                        {linkMutations.linkRecord.isPending ? 'Linking...' : 'Confirm Link'}
                      </OpButton>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Read & Understand Acknowledgment Tab */}
        {activeTab === 'acknowledgments' && (
          <div className="space-y-6">
            <OpCard
              title="Workforce Read-and-Understand Acknowledgment (OSHA 1910.119(f)(4))"
              subtitle="Verification that operating technicians and contractors have acknowledged and been trained on the latest published procedure revision."
              action={
                <OpButton variant="primary" href="/operating-procedures/acknowledgments">
                  Open Acknowledgment Hub &rarr;
                </OpButton>
              }
            >
              <div className="grid gap-4 sm:grid-cols-4 mb-4">
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Compliance Rate</span>
                  <div className="mt-1 text-2xl font-bold text-emerald-600">
                    {ackStatsQuery.data?.compliancePercentage ?? 100}%
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Total Assigned</span>
                  <div className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">
                    {ackStatsQuery.data?.totalAssigned ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Signed & Acknowledged</span>
                  <div className="mt-1 text-2xl font-bold text-emerald-600">
                    {ackStatsQuery.data?.acknowledgedCount ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--psm-line)] p-3">
                  <span className="text-[10px] uppercase font-bold text-[var(--psm-muted)]">Pending Sign-off</span>
                  <div className="mt-1 text-2xl font-bold text-amber-600">
                    {ackStatsQuery.data?.pendingCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-[var(--psm-fg)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-primary">OSHA 1910.119(f)(4) Execution Gating Rule</p>
                  <p className="mt-0.5 text-[var(--psm-muted)]">
                    Operating personnel are required to complete digital acknowledgment before running this procedure in the field.
                  </p>
                </div>
                <OpButton href="/operating-procedures/acknowledgments">
                  Sign Acknowledgment
                </OpButton>
              </div>
            </OpCard>
          </div>
        )}

        {/* Scopes Tab */}
        {activeTab === 'scopes' && (
          <div className="space-y-6">
            <OpCard title="Add Equipment / Area Scope" subtitle="Map equipment tags, unit areas, or job roles to this procedure.">
              <form onSubmit={handleAddScope} className="flex flex-wrap items-end gap-3">
                <div className="w-44">
                  <OpField label="Scope Type">
                    <select
                      className={opInput}
                      value={newScopeType}
                      onChange={(e) => setNewScopeType(e.target.value)}
                    >
                      <option value="Equipment">Equipment Tag</option>
                      <option value="Unit">Process Unit</option>
                      <option value="Area">Plant Area</option>
                      <option value="Role">Worker Role</option>
                      <option value="Operating Mode">Operating Mode</option>
                      <option value="Chemical">Chemical Substance</option>
                    </select>
                  </OpField>
                </div>
                <div className="min-w-[240px] flex-1">
                  <OpField label="Scope Label / Tag">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pump P-101A, Alkylation Flare, Control Room Board Operator"
                      className={opInput}
                      value={newScopeLabel}
                      onChange={(e) => setNewScopeLabel(e.target.value)}
                    />
                  </OpField>
                </div>
                <OpButton type="submit" disabled={mutations.addScope.isPending}>
                  {mutations.addScope.isPending ? 'Adding...' : 'Add Scope'}
                </OpButton>
              </form>
            </OpCard>

            <OpCard title="Active Scopes & Equipment Boundaries">
              {p.scopes?.length ? (
                <div className="divide-y divide-[var(--psm-line)]">
                  {p.scopes.map((s: OpScopeRow) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-[var(--psm-fg)]">{s.scope_label}</span>
                        <span className="ml-2 rounded bg-[var(--psm-surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--psm-muted)]">
                          {s.scope_type}
                        </span>
                        <div className="text-[10px] text-[var(--psm-muted)]">Linked {fmtDateTime(s.linked_at)}</div>
                      </div>
                      <OpButton
                        variant="secondary"
                        onClick={() => handleRemoveScope(s.id)}
                        disabled={mutations.removeScope.isPending}
                      >
                        Remove
                      </OpButton>
                    </div>
                  ))}
                </div>
              ) : (
                <OpEmpty
                  title="No scopes mapped"
                  message="This procedure has no specific equipment tags or unit scopes mapped yet."
                />
              )}
            </OpCard>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <OpCard title="Immutable Audit Event History" subtitle="Full tamper-proof audit trail of changes, status transitions, and owner assignments.">
            {historyQuery.isLoading ? (
              <OpLoading rows={4} />
            ) : historyQuery.data?.length ? (
              <div className="divide-y divide-[var(--psm-line)]">
                {historyQuery.data.map((evt: OpHistoryEvent) => (
                  <div key={evt.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--psm-fg)]">{evt.event_title}</span>
                      <span className="text-[var(--psm-muted)]">{fmtDateTime(evt.created_at)}</span>
                    </div>
                    {evt.event_description ? (
                      <p className="mt-1 text-[var(--psm-muted)]">{evt.event_description}</p>
                    ) : null}
                    <div className="mt-1 text-[10px] text-[var(--psm-muted)]">
                      Actor: {evt.actor_user_id ?? 'System'} | Type: {evt.event_type}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-[var(--psm-muted)]">No history events logged yet.</p>
            )}
          </OpCard>
        )}

        {/* Access Log Tab */}
        {activeTab === 'access-log' && (
          <OpCard
            title="OSHA Right-to-Know Access Log"
            subtitle="Proof of 24/7 worker access to safe operating procedures without management barrier (OSHA 1910.119(f))."
          >
            {accessLogQuery.isLoading ? (
              <OpLoading rows={4} />
            ) : accessLogQuery.data?.length ? (
              <div className="divide-y divide-[var(--psm-line)]">
                {accessLogQuery.data.map((log: OpAccessLog) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-[var(--psm-fg)]">
                        Action: {log.access_type}
                      </span>
                      <span className="ml-2 text-[var(--psm-muted)]">
                        Channel: {log.channel ?? 'Web'}
                      </span>
                    </div>
                    <div className="text-[var(--psm-muted)]">{fmtDateTime(log.created_at)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-[var(--psm-muted)]">No access records logged yet.</p>
            )}
          </OpCard>
        )}
      </div>
    </OpLayout>
  );
}
