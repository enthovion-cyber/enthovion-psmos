'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
  criticalityTone,
  fmtDate,
  fmtDateTime,
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import {
  useOpJsas,
  useOpSwpMutations,
  useOpSwpPrograms
} from '../hooks/useOperatingProcedures';
import type { OpJsa, OpSwpProgram } from '../types/operating-procedures.types';

export function OpSafeWorkPracticesPage() {
  const [activeTab, setActiveTab] = useState<'programs' | 'jsas'>('programs');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // JSA Builder Modal state
  const [isNewJsaOpen, setIsNewJsaOpen] = useState(false);
  const [jsaTitle, setJsaTitle] = useState('');
  const [jsaLocation, setJsaLocation] = useState('');
  const [jsaSwpProgramId, setJsaSwpProgramId] = useState('');
  const [jsaInitialRisk, setJsaInitialRisk] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [jsaSteps, setJsaSteps] = useState([
    { description: 'Isolate equipment and verify zero energy', hazards: 'Residual pressure or voltage', controls: 'Apply lock and tag; test voltmeter' },
    { description: 'Open piping flange and inspect seal', hazards: 'Chemical splash or vapor release', controls: 'Wear full chemical face shield and acid gloves' }
  ]);

  // Toolbox Talk Briefing Roster modal state
  const [rosterJsa, setRosterJsa] = useState<OpJsa | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [contractorCompany, setContractorCompany] = useState('');
  const [workerRole, setWorkerRole] = useState('Craft Technician');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: programs, isLoading: programsLoading, error: programsError } = useOpSwpPrograms();
  const { data: jsas, isLoading: jsasLoading, error: jsasError, refetch: refetchJsas } = useOpJsas({
    status: statusFilter === 'all' ? undefined : statusFilter
  });

  const mutations = useOpSwpMutations();

  const metrics = useMemo(() => {
    return {
      activePrograms: programs?.filter((p) => p.is_active).length ?? 0,
      totalJsas: jsas?.length ?? 0,
      activeJsas: jsas?.filter((j) => j.status === 'Active' || j.status === 'Approved').length ?? 0,
      highRiskJsas: jsas?.filter((j) => j.initial_risk_level === 'High' || j.initial_risk_level === 'Critical').length ?? 0
    };
  }, [programs, jsas]);

  const handleCreateJsaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await mutations.createJsa.mutateAsync({
        title: jsaTitle,
        jobLocation: jsaLocation,
        swpProgramId: jsaSwpProgramId || null,
        initialRiskLevel: jsaInitialRisk,
        steps: jsaSteps
      });
      setIsNewJsaOpen(false);
      setJsaTitle('');
      setJsaLocation('');
      refetchJsas();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleSignRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterJsa) return;
    setActionError(null);
    try {
      await mutations.signRoster.mutateAsync({
        jsaId: rosterJsa.id,
        data: {
          workerName,
          contractorCompany: contractorCompany || null,
          role: workerRole
        }
      });
      setWorkerName('');
      setContractorCompany('');
      refetchJsas();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <OpLayout current="Safe Work Practices & JSA">
      <div className="space-y-6">
        <OpHeader
          title="Safe Work Practices (SWP) & Job Safety Analysis (JSA)"
          subtitle="OSHA 29 CFR 1910.119(f)(4) hazard control programs: Lockout/Tagout, Confined Space Entry, Line Breaking, Hot Work, and pre-job Job Safety Analyses."
          actions={
            <OpButton variant="primary" onClick={() => setIsNewJsaOpen(true)}>
              + Create New JSA
            </OpButton>
          }
        />

        {/* Top KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OpMetric label="Active SWP Programs" value={metrics.activePrograms} tone="good" />
          <OpMetric label="Total Job Safety Analyses" value={metrics.totalJsas} tone="neutral" />
          <OpMetric label="Active In-Field JSAs" value={metrics.activeJsas} tone="warn" />
          <OpMetric label="High Risk Safety Tasks" value={metrics.highRiskJsas} tone={metrics.highRiskJsas > 0 ? 'danger' : 'neutral'} />
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[var(--psm-line)] text-sm font-semibold">
          <button
            onClick={() => setActiveTab('programs')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'programs'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Safe Work Practice Programs (1910.119(f)(4))
          </button>
          <button
            onClick={() => setActiveTab('jsas')}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === 'jsas'
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
            }`}
          >
            Job Safety Analysis (JSA / JHA) Register ({jsas?.length ?? 0})
          </button>
        </div>

        {actionError && <OpError error={actionError} />}

        {/* Tab 1: SWP Programs Library */}
        {activeTab === 'programs' && (
          <div className="space-y-4">
            {programsLoading ? (
              <OpLoading rows={4} />
            ) : programsError ? (
              <OpError error={programsError} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {programs?.map((prog: OpSwpProgram) => (
                  <div
                    key={prog.id}
                    className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
                          {prog.program_code}
                        </span>
                        <h3 className="mt-1 text-base font-bold text-[var(--psm-fg)]">{prog.program_name}</h3>
                      </div>
                      <OpBadge tone={prog.is_active ? 'good' : 'neutral'}>
                        {prog.is_active ? 'Active Program' : 'Inactive'}
                      </OpBadge>
                    </div>

                    <p className="text-xs text-[var(--psm-muted)] leading-relaxed">{prog.description}</p>

                    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs space-y-1.5">
                      <div>
                        <span className="font-semibold text-[var(--psm-fg)]">OSHA Regulatory Basis: </span>
                        <span className="text-[var(--psm-muted)]">{prog.regulatory_reference}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--psm-fg)]">Permit Required: </span>
                        <span className="text-primary font-medium">{prog.permit_required ? prog.permit_type || 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--psm-fg)]">Mandatory PPE: </span>
                        <span className="text-[var(--psm-muted)]">{prog.mandatory_ppe.join(', ') || 'Standard Site PPE'}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <OpButton
                        variant="secondary"
                        onClick={() => {
                          setJsaSwpProgramId(prog.id);
                          setJsaTitle(`JSA for ${prog.program_name}`);
                          setIsNewJsaOpen(true);
                        }}
                      >
                        + Create JSA for this Program
                      </OpButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: JSA Register */}
        {activeTab === 'jsas' && (
          <div className="space-y-4">
            {jsasLoading ? (
              <OpLoading rows={5} />
            ) : jsasError ? (
              <OpError error={jsasError} onRetry={refetchJsas} />
            ) : jsas?.length === 0 ? (
              <OpEmpty
                title="No Job Safety Analyses Created"
                message="No JSAs are currently logged. Safe work practices require a JSA prior to non-routine, hazardous, or permit-required tasks."
                action={
                  <OpButton variant="primary" onClick={() => setIsNewJsaOpen(true)}>
                    Create First JSA
                  </OpButton>
                }
              />
            ) : (
              <div className="space-y-3">
                {jsas?.map((jsa: OpJsa) => (
                  <div
                    key={jsa.id}
                    className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-primary/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-primary">{jsa.jsa_number}</span>
                          <OpBadge tone={criticalityTone(jsa.initial_risk_level)}>
                            Risk: {jsa.initial_risk_level}
                          </OpBadge>
                          <OpBadge tone={statusTone(jsa.status)}>{jsa.status}</OpBadge>
                        </div>
                        <h3 className="text-base font-bold text-[var(--psm-fg)]">{jsa.title}</h3>
                        <p className="text-xs text-[var(--psm-muted)]">
                          Location: <span className="font-medium text-[var(--psm-fg)]">{jsa.job_location}</span> &bull;
                          Created: {fmtDate(jsa.created_at)}
                          {jsa.approved_at && ` &bull; Approved: ${fmtDate(jsa.approved_at)}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {jsa.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await mutations.approveJsa.mutateAsync({ jsaId: jsa.id });
                              refetchJsas();
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            Approve JSA
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRosterJsa(jsa)}
                          className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]"
                        >
                          Toolbox Sign-Off Roster
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create JSA Modal */}
        {isNewJsaOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">Create Job Safety Analysis (JSA)</h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Structured hazard identification, preventative safeguards, and residual risk rating.
              </p>

              <form onSubmit={handleCreateJsaSubmit} className="mt-4 space-y-4">
                <OpField label="Task / Job Title" required>
                  <input
                    type="text"
                    className={opInput}
                    value={jsaTitle}
                    onChange={(e) => setJsaTitle(e.target.value)}
                    placeholder="e.g. Pump P-102 Mechanical Seal Replacement"
                    required
                  />
                </OpField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <OpField label="Job Location / Unit" required>
                    <input
                      type="text"
                      className={opInput}
                      value={jsaLocation}
                      onChange={(e) => setJsaLocation(e.target.value)}
                      placeholder="e.g. Crude Distillation Unit 1"
                      required
                    />
                  </OpField>

                  <OpField label="Initial Risk Rating">
                    <select
                      className={opInput}
                      value={jsaInitialRisk}
                      onChange={(e) => setJsaInitialRisk(e.target.value as any)}
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                      <option value="Critical">Critical Safety</option>
                    </select>
                  </OpField>
                </div>

                <OpField label="Linked Safe Work Practice (SWP)">
                  <select
                    className={opInput}
                    value={jsaSwpProgramId}
                    onChange={(e) => setJsaSwpProgramId(e.target.value)}
                  >
                    <option value="">-- Optional SWP Program --</option>
                    {programs?.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.program_code}] {p.program_name}
                      </option>
                    ))}
                  </select>
                </OpField>

                <div className="flex justify-end gap-2 pt-2">
                  <OpButton variant="secondary" onClick={() => setIsNewJsaOpen(false)}>
                    Cancel
                  </OpButton>
                  <OpButton variant="primary" type="submit" disabled={mutations.createJsa.isPending}>
                    {mutations.createJsa.isPending ? 'Saving...' : 'Save & Build JSA'}
                  </OpButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toolbox Talk Roster Modal */}
        {rosterJsa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
              <h3 className="text-base font-bold text-[var(--psm-fg)]">
                Pre-Job Briefing Roster ({rosterJsa.jsa_number})
              </h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Sign off that you attended the pre-job safety briefing and understand all hazards and controls.
              </p>

              <form onSubmit={handleSignRosterSubmit} className="mt-4 space-y-4">
                <OpField label="Worker Full Name" required>
                  <input
                    type="text"
                    className={opInput}
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                  />
                </OpField>

                <OpField label="Company (Contractor / Employee)">
                  <input
                    type="text"
                    className={opInput}
                    value={contractorCompany}
                    onChange={(e) => setContractorCompany(e.target.value)}
                    placeholder="e.g. In-house Operations or XYZ Contractors"
                  />
                </OpField>

                <div className="flex justify-end gap-2 pt-2">
                  <OpButton variant="secondary" onClick={() => setRosterJsa(null)}>
                    Close
                  </OpButton>
                  <button
                    type="submit"
                    disabled={mutations.signRoster.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
                  >
                    {mutations.signRoster.isPending ? 'Signing...' : 'Sign Briefing Roster'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OpLayout>
  );
}
