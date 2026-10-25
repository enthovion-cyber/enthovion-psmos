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
  fmtDate,
  fmtDateTime,
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import {
  useOpAuditPackage,
  useOpAuditPackages,
  useOpReportMutations
} from '../hooks/useOperatingProcedures';
import type { OpAuditPackage } from '../types/operating-procedures.types';

export function OpAuditPackagePage() {
  const currentYear = new Date().getUTCFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: packages, isLoading, error, refetch } = useOpAuditPackages({
    year: selectedYear
  });

  const { data: packageDetail, isLoading: detailLoading } = useOpAuditPackage(
    selectedPackageId || packages?.[0]?.id || undefined
  );

  const mutations = useOpReportMutations();

  const handleGeneratePackage = async () => {
    setActionError(null);
    try {
      const pkg = await mutations.generatePackage.mutateAsync({
        year: selectedYear,
        title: `OSHA 29 CFR 1910.119(f) Annual Audit Evidence Package - ${selectedYear}`
      });
      setSelectedPackageId(pkg.id);
      refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const summary = packageDetail?.package_data?.executiveSummary;

  return (
    <OpLayout current="Audit Evidence Packages & Controlled Copies">
      <div className="space-y-6">
        <OpHeader
          title="OSHA 1910.119(f) Audit Evidence Packages & Controlled Distribution"
          subtitle="Generate, certify, and export complete audit packages proving procedure accuracy, annual certification (f)(3), workforce acknowledgment (f)(4), and MOC change control (l)."
          actions={
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-xs font-semibold text-[var(--psm-fg)]"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                <option value={currentYear}>{currentYear} Audit Cycle</option>
                <option value={currentYear - 1}>{currentYear - 1} Audit Cycle</option>
                <option value={currentYear - 2}>{currentYear - 2} Audit Cycle</option>
              </select>

              <OpButton
                variant="primary"
                onClick={handleGeneratePackage}
                disabled={mutations.generatePackage.isPending}
              >
                {mutations.generatePackage.isPending ? 'Compiling Package...' : '+ Generate Audit Package'}
              </OpButton>
            </div>
          }
        />

        {actionError && <OpError error={actionError} />}

        {/* Executive Compliance Scorecards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <OpMetric
              label="Overall Compliance"
              value={`${summary.compliancePercentage}%`}
              tone={summary.compliancePercentage >= 90 ? 'good' : 'warn'}
            />
            <OpMetric
              label="Total Procedures"
              value={summary.totalOperatingProcedures}
              tone="neutral"
            />
            <OpMetric
              label="Annual Employer Statement"
              value={summary.annualStatementSigned ? 'Certified & Signed' : 'Pending Sign-off'}
              tone={summary.annualStatementSigned ? 'good' : 'warn'}
            />
            <OpMetric
              label="Workforce Acknowledgment"
              value={summary.workforceAcknowledgmentCompliance}
              tone="good"
            />
            <OpMetric
              label="Open MOC Change Flags"
              value={summary.openChangeFlags}
              tone={summary.openChangeFlags > 0 ? 'danger' : 'good'}
            />
          </div>
        )}

        {/* Package Selector & Content */}
        {isLoading ? (
          <OpLoading rows={6} />
        ) : error ? (
          <OpError error={error} onRetry={refetch} />
        ) : !packages?.length ? (
          <OpEmpty
            title="No Audit Package Generated for this Cycle"
            message={`No audit evidence package has been compiled for ${selectedYear} yet. Generate a package to collect all verification records across OSHA 1910.119(f) sub-paragraphs.`}
            action={
              <OpButton variant="primary" onClick={handleGeneratePackage}>
                Generate {selectedYear} Audit Package
              </OpButton>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Sidebar list of generated packages */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                Compiled Packages ({packages.length})
              </h3>
              {packages.map((pkg) => {
                const isSelected = (selectedPackageId || packages[0]?.id) === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-[var(--psm-line)] bg-[var(--psm-surface)] hover:bg-[var(--psm-surface-2)]'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-primary">{pkg.package_number}</span>
                    <h4 className="text-sm font-semibold text-[var(--psm-fg)] line-clamp-1">{pkg.title}</h4>
                    <p className="text-[11px] text-[var(--psm-muted)] mt-1">
                      Compiled: {fmtDateTime(pkg.created_at)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Main Package Detailed Evidence View */}
            <div className="space-y-6">
              {detailLoading ? (
                <OpLoading rows={6} />
              ) : packageDetail ? (
                <div className="space-y-6">
                  {/* Controlled Document Distribution Watermark Banner */}
                  <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Controlled Copy Distribution Rule (OSHA 1910.119(f)(1))
                      </span>
                      <OpBadge tone="good">Official Controlled Copy</OpBadge>
                    </div>
                    <p className="text-[var(--psm-fg)]">
                      All physical copies printed from this system bear the dynamic watermark:
                      <span className="font-mono font-bold text-primary ml-1">
                        "UNCONTROLLED COPY WHEN PRINTED - VALID ONLY ON {new Date().toISOString().slice(0, 10)}"
                      </span>
                    </p>
                  </div>

                  {/* Evidence Section 1: 1910.119(f)(1) */}
                  <OpCard
                    title="Section 1: Operating Procedures Register (OSHA 1910.119(f)(1))"
                    subtitle="Certified written procedures covering startup, normal operation, temporary operations, emergency shutdown, and turnaround."
                  >
                    <div className="text-xs text-[var(--psm-fg)]">
                      <p>
                        Total Master Procedures: <span className="font-bold">{summary?.totalOperatingProcedures}</span> | Certified Current: <span className="font-bold text-emerald-600">{summary?.certifiedCurrent}</span>
                      </p>
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="border-b border-[var(--psm-line)] text-[11px] font-bold text-[var(--psm-muted)] uppercase">
                            <tr>
                              <th className="py-2 pr-3">Procedure #</th>
                              <th className="py-2 pr-3">Title</th>
                              <th className="py-2 pr-3">Mode</th>
                              <th className="py-2 pr-3">Status</th>
                              <th className="py-2 pr-3">Cert Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--psm-line)] text-[11px]">
                            {packageDetail.package_data?.f1_procedureRegister?.slice(0, 6).map((p: any) => (
                              <tr key={p.id}>
                                <td className="py-2 pr-3 font-mono text-primary font-semibold">{p.procedure_number}</td>
                                <td className="py-2 pr-3 text-[var(--psm-fg)] font-medium">{p.title}</td>
                                <td className="py-2 pr-3 text-[var(--psm-muted)]">{p.operating_mode}</td>
                                <td className="py-2 pr-3"><OpBadge tone={statusTone(p.procedure_status)}>{p.procedure_status}</OpBadge></td>
                                <td className="py-2 pr-3"><OpBadge tone={statusTone(p.certification_status)}>{p.certification_status}</OpBadge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </OpCard>

                  {/* Evidence Section 2: 1910.119(f)(3) */}
                  <OpCard
                    title="Section 2: Periodic Annual Certification (OSHA 1910.119(f)(3))"
                    subtitle="Employer certification records attesting that procedures reflect current operating practice and facility conditions."
                  >
                    <div className="space-y-3 text-xs">
                      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                        <span className="font-bold text-[var(--psm-fg)]">Annual Employer Statement Status: </span>
                        <span className="font-semibold text-emerald-600">
                          {summary?.annualStatementSigned ? 'Certified & Signed by Operations Manager' : 'Pending Execution'}
                        </span>
                      </div>
                      <p className="text-[var(--psm-muted)]">
                        Logged <span className="font-bold text-[var(--psm-fg)]">{packageDetail.package_data?.f3_smeReviews?.length || 0}</span> subject matter expert review cycles completed against the 5-point OSHA compliance questionnaire.
                      </p>
                    </div>
                  </OpCard>

                  {/* Evidence Section 3: 1910.119(f)(4) */}
                  <OpCard
                    title="Section 3: Safe Work Practices & Workforce Acknowledgment (OSHA 1910.119(f)(4))"
                    subtitle="Mandatory programs for Lockout/Tagout, Confined Space Entry, Line Breaking, and worker e-signature sign-offs."
                  >
                    <div className="space-y-3 text-xs text-[var(--psm-fg)]">
                      <p>
                        Active SWP Hazard Control Programs: <span className="font-bold">{summary?.activeSafeWorkPracticePrograms}</span>
                      </p>
                      <p>
                        Workforce Read-and-Understand Compliance: <span className="font-bold text-emerald-600">{summary?.workforceAcknowledgmentCompliance}</span>
                      </p>
                    </div>
                  </OpCard>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </OpLayout>
  );
}
