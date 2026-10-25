'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  useOpAnnualStatements,
  useOpCertificationChecklist,
  useOpCertificationCycles,
  useOpCertificationMutations
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
  OpMetric,
  fmtDate,
  fmtDateTime,
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import type {
  OpAnnualStatement,
  OpCertificationCycle,
  OpChecklistItem
} from '../types/operating-procedures.types';

export function OpAnnualCertificationPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'queue' | 'statements'>('queue');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Certify modal state
  const [certifyingCycle, setCertifyingCycle] = useState<OpCertificationCycle | null>(null);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean>>({});
  const [findingsSummary, setFindingsSummary] = useState('');
  const [certOutcome, setCertOutcome] = useState<'Current & Accurate (No Change)' | 'Certified with Minor Edits' | 'Revision Required via MOC'>('Current & Accurate (No Change)');
  const [eSignConsent, setESignConsent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Statement sign state
  const [signingStatementId, setSigningStatementId] = useState<string | null>(null);

  const cyclesQuery = useOpCertificationCycles({ year: selectedYear, status: statusFilter || undefined });
  const checklistQuery = useOpCertificationChecklist();
  const statementsQuery = useOpAnnualStatements();
  const mutations = useOpCertificationMutations();

  if (cyclesQuery.isLoading || checklistQuery.isLoading) {
    return (
      <OpLayout current="Annual Certification">
        <OpLoading rows={8} />
      </OpLayout>
    );
  }

  const cycles = cyclesQuery.data ?? [];
  const checklist = checklistQuery.data ?? [];
  const statements = statementsQuery.data ?? [];

  // Metrics summary
  const total = cycles.length;
  const certified = cycles.filter((c) => c.status === 'Certified' || c.status === 'Certified With Changes').length;
  const overdue = cycles.filter((c) => c.status === 'Overdue').length;
  const upcoming = cycles.filter((c) => c.status === 'Upcoming' || c.status === 'Due').length;
  const compliancePct = total > 0 ? Math.round((certified / total) * 100) : 100;

  const handleOpenCertifyModal = (cycle: OpCertificationCycle) => {
    setCertifyingCycle(cycle);
    // Initialize default checklist answers (true = yes / complies)
    const defaults: Record<string, boolean> = {};
    for (const item of checklist) {
      defaults[item.item_code] = true;
    }
    setChecklistAnswers(defaults);
    setFindingsSummary('');
    setCertOutcome('Current & Accurate (No Change)');
    setESignConsent(false);
    setActionError(null);
  };

  const handleSubmitCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certifyingCycle) return;
    if (!eSignConsent) {
      setActionError('You must check the electronic signature attestation box to complete annual certification.');
      return;
    }

    setActionError(null);
    try {
      await mutations.recordReview.mutateAsync({
        cycleId: certifyingCycle.id,
        data: {
          checklistResponses: checklistAnswers,
          findingsSummary: findingsSummary || null,
          outcome: certOutcome,
          meaningOfSignature:
            'I certify that I have reviewed this operating procedure and verify that it reflects current operating practice and safe operating limits per OSHA 1910.119(f)(3).'
        }
      });
      setCertifyingCycle(null);
      cyclesQuery.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleGenerateStatement = async () => {
    setActionError(null);
    try {
      await mutations.generateStatement.mutateAsync({
        siteId: 'all',
        year: selectedYear
      });
      statementsQuery.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleSignStatement = async (statementId: string) => {
    setActionError(null);
    try {
      await mutations.signStatement.mutateAsync({
        statementId,
        data: {
          meaningOfSignature: 'I certify on behalf of the employer that all active operating procedures have been reviewed and verified current and accurate.'
        }
      });
      setSigningStatementId(null);
      statementsQuery.refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <OpLayout current="Annual Certification">
      <div className="space-y-6">
        <OpHeader
          title="Periodic Annual Certification Hub"
          subtitle="OSHA 29 CFR 1910.119(f)(3) compliance: 'The employer shall certify annually that these operating procedures are current and accurate.'"
          actions={
            <div className="flex items-center gap-2">
              <select
                className={opInput}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>
                    Cycle Year: {y}
                  </option>
                ))}
              </select>
              <OpButton variant="secondary" onClick={() => cyclesQuery.refetch()}>
                Refresh
              </OpButton>
            </div>
          }
        />

        {actionError ? <OpError error={actionError} /> : null}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <OpMetric label="Total Cycles" value={total} tone="neutral" />
          <OpMetric label="Certified Current" value={certified} tone="good" />
          <OpMetric label="Upcoming / Due" value={upcoming} tone="info" />
          <OpMetric label="Overdue Cycles" value={overdue} tone={overdue > 0 ? 'danger' : 'good'} />
          <OpMetric
            label="Annual Compliance %"
            value={`${compliancePct}%`}
            tone={compliancePct >= 90 ? 'good' : 'warn'}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--psm-line)] text-sm font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'queue'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Annual SME Certification Queue ({cycles.length})
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'statements'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Site Employer Certification Statements ({statements.length})
          </button>
        </div>

        {/* Tab 1: SME Certification Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <OpCard>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--psm-muted)]">Filter Status:</span>
                  <select
                    className={opInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Upcoming">Upcoming (within 60 days)</option>
                    <option value="Due">Due Today</option>
                    <option value="Overdue">Overdue (Escalation Active)</option>
                    <option value="Certified">Certified</option>
                  </select>
                </div>

                <div className="text-xs text-[var(--psm-muted)]">
                  OSHA requires certification as often as necessary, not to exceed 12 months.
                </div>
              </div>
            </OpCard>

            <OpCard>
              {cycles.length === 0 ? (
                <OpEmpty
                  title="No certification cycles found"
                  message={`No procedure certification cycles match the selected year (${selectedYear}) and filters.`}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                        <th className="py-2.5 pr-4 font-semibold">Procedure</th>
                        <th className="py-2.5 pr-4 font-semibold">Title</th>
                        <th className="py-2.5 pr-4 font-semibold">Criticality</th>
                        <th className="py-2.5 pr-4 font-semibold">Certification Status</th>
                        <th className="py-2.5 pr-4 font-semibold">Due Date</th>
                        <th className="py-2.5 pr-4 font-semibold">Last Certified</th>
                        <th className="py-2.5 pr-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--psm-line)]">
                      {cycles.map((c: OpCertificationCycle) => (
                        <tr key={c.id} className="hover:bg-[var(--psm-surface-2)]">
                          <td className="py-3 pr-4 font-mono font-semibold text-primary">
                            <Link href={`/operating-procedures/${c.procedure_id}`} className="hover:underline">
                              {c.op_procedures?.procedure_number ?? 'SOP'}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 font-semibold text-[var(--psm-fg)]">
                            {c.op_procedures?.title ?? '-'}
                          </td>
                          <td className="py-3 pr-4">
                            <OpBadge tone={c.op_procedures?.criticality === 'High' ? 'danger' : 'warn'}>
                              {c.op_procedures?.criticality ?? 'Medium'}
                            </OpBadge>
                          </td>
                          <td className="py-3 pr-4">
                            <OpBadge tone={statusTone(c.status)}>{c.status}</OpBadge>
                          </td>
                          <td className="py-3 pr-4 font-medium">
                            <span className={c.status === 'Overdue' ? 'font-bold text-danger' : 'text-[var(--psm-fg)]'}>
                              {fmtDate(c.due_date)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-[var(--psm-muted)]">{fmtDate(c.last_certified_at)}</td>
                          <td className="py-3 pr-4 text-right">
                            <div className="flex justify-end gap-2">
                              {c.status !== 'Certified' ? (
                                <OpButton onClick={() => handleOpenCertifyModal(c)}>
                                  Certify Now &rarr;
                                </OpButton>
                              ) : (
                                <span className="font-semibold text-emerald-600 text-xs">
                                  ✓ Certified
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </OpCard>
          </div>
        )}

        {/* Tab 2: Site Employer Certification Statements */}
        {activeTab === 'statements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[var(--psm-fg)]">
                  OSHA Annual Employer Certification Statements
                </h3>
                <p className="text-xs text-[var(--psm-muted)]">
                  Legal employer letters certifying that operating procedures across the facility are current and accurate.
                </p>
              </div>

              <OpButton onClick={handleGenerateStatement} disabled={mutations.generateStatement.isPending}>
                {mutations.generateStatement.isPending ? 'Generating...' : '+ Generate Annual Statement'}
              </OpButton>
            </div>

            {statements.length === 0 ? (
              <OpEmpty
                title="No annual statements generated"
                message="Click '+ Generate Annual Statement' to compile the site-wide compliance tally and create the employer certification statement."
                action={
                  <OpButton onClick={handleGenerateStatement}>
                    Generate Statement for {selectedYear}
                  </OpButton>
                }
              />
            ) : (
              <div className="space-y-6">
                {statements.map((stmt: OpAnnualStatement) => (
                  <OpCard
                    key={stmt.id}
                    title={`Annual Employer Statement — Year ${stmt.year}`}
                    subtitle={`Status: ${stmt.statement_status} | Compliance: ${stmt.compliance_percentage}% (${stmt.certified_procedures}/${stmt.total_procedures} procedures)`}
                    action={
                      stmt.statement_status !== 'Certified & Signed' ? (
                        <OpButton onClick={() => setSigningStatementId(stmt.id)}>
                          Sign Employer Statement &rarr;
                        </OpButton>
                      ) : (
                        <OpBadge tone="good">Certified & Signed</OpBadge>
                      )
                    }
                  >
                    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-5 font-mono text-xs whitespace-pre-wrap text-[var(--psm-fg)] leading-relaxed">
                      {stmt.statement_text}
                    </div>

                    {stmt.signed_at ? (
                      <div className="mt-4 flex items-center justify-between text-xs text-[var(--psm-muted)] border-t border-[var(--psm-line)] pt-3">
                        <div>
                          Signed by Authorized Employer Representative: <strong className="text-[var(--psm-fg)]">{stmt.signed_by_user_id ?? 'Site Operations Manager'}</strong>
                        </div>
                        <div>Date: {fmtDateTime(stmt.signed_at)}</div>
                      </div>
                    ) : null}

                    {signingStatementId === stmt.id ? (
                      <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                        <h4 className="text-xs font-bold text-[var(--psm-fg)]">
                          Plant / Site Manager E-Signature Sign-Off
                        </h4>
                        <p className="text-xs text-[var(--psm-muted)]">
                          By affixing your digital signature, you formally certify that the site's operating procedures have been audited, reviewed against Process Safety Information (PSI), and are current and accurate under penalty of OSHA law.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                          <OpButton variant="secondary" onClick={() => setSigningStatementId(null)}>
                            Cancel
                          </OpButton>
                          <OpButton onClick={() => handleSignStatement(stmt.id)}>
                            Affix Signature & Certify Statement
                          </OpButton>
                        </div>
                      </div>
                    ) : null}
                  </OpCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Certify Procedure (OSHA 1910.119(f)(3)) */}
        {certifyingCycle ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--psm-surface)] p-6 shadow-xl border border-[var(--psm-line)]">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">
                Annual SME Certification Review
              </h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                {certifyingCycle.op_procedures?.procedure_number}: {certifyingCycle.op_procedures?.title}
              </p>

              <form onSubmit={handleSubmitCertification} className="mt-5 space-y-5">
                {/* OSHA Mandated Checklist Questions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                    OSHA 1910.119(f)(3) Review Checklist
                  </h4>
                  {checklist.map((item: OpChecklistItem) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs"
                    >
                      <label className="flex items-start justify-between gap-3 font-semibold text-[var(--psm-fg)]">
                        <span>{item.question_text}</span>
                        <input
                          type="checkbox"
                          checked={checklistAnswers[item.item_code] ?? true}
                          onChange={(e) =>
                            setChecklistAnswers({
                              ...checklistAnswers,
                              [item.item_code]: e.target.checked
                            })
                          }
                          className="mt-0.5 h-4 w-4 rounded border-[var(--psm-line)] text-primary"
                        />
                      </label>
                      <span className="block mt-1 text-[10px] text-[var(--psm-muted)] font-mono">
                        Ref: OSHA {item.osha_subparagraph}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Outcome Selector */}
                <div>
                  <OpField label="Certification Outcome" required>
                    <select
                      className={opInput}
                      value={certOutcome}
                      onChange={(e) => setCertOutcome(e.target.value as any)}
                    >
                      <option value="Current & Accurate (No Change)">
                        Current & Accurate (No Changes Required — Safe to Operate)
                      </option>
                      <option value="Certified with Minor Edits">
                        Certified with Minor Typos/Formatting (No Process Impact)
                      </option>
                      <option value="Revision Required via MOC">
                        Revision Required (Process/Equipment Changed — Flags MOC)
                      </option>
                    </select>
                  </OpField>
                </div>

                {/* Findings summary */}
                <div>
                  <OpField label="Reviewer Notes & Verification Evidence">
                    <textarea
                      rows={3}
                      className={opInput}
                      placeholder="Document any field verifications, walk-through observations, or P&ID checks conducted..."
                      value={findingsSummary}
                      onChange={(e) => setFindingsSummary(e.target.value)}
                    />
                  </OpField>
                </div>

                {/* E-Signature Consent */}
                <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 text-xs">
                  <label className="flex items-start gap-2.5 font-medium text-[var(--psm-fg)]">
                    <input
                      type="checkbox"
                      checked={eSignConsent}
                      onChange={(e) => setESignConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--psm-line)] text-primary"
                    />
                    <span>
                      <strong className="block text-primary">OSHA 1910.119(f)(3) Legal Certification Attestation:</strong>
                      "I hereby certify as a qualified Subject Matter Expert (SME) that I have reviewed this operating procedure and verify that it reflects current operating practice and safe operating limits."
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--psm-line)]">
                  <OpButton variant="secondary" onClick={() => setCertifyingCycle(null)}>
                    Cancel
                  </OpButton>
                  <OpButton type="submit" disabled={mutations.recordReview.isPending}>
                    {mutations.recordReview.isPending ? 'Certifying...' : 'Sign & Certify Procedure'}
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
