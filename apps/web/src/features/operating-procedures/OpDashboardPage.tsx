'use client';

import Link from 'next/link';
import { useOpDashboard } from './hooks/useOperatingProcedures';
import {
  OpBadge,
  OpButton,
  OpCard,
  OpEmpty,
  OpError,
  OpHeader,
  OpLayout,
  OpLoading,
  OpMetric,
  criticalityTone,
  fmtDate,
  statusTone
} from './shared/OpUi';
import type { OpProcedure } from './types/operating-procedures.types';

export function OpDashboardPage() {
  const query = useOpDashboard({});

  if (query.isLoading) {
    return (
      <OpLayout current="Dashboard">
        <OpLoading rows={8} />
      </OpLayout>
    );
  }

  if (query.isError) {
    return (
      <OpLayout current="Dashboard">
        <OpError error={query.error} onRetry={() => query.refetch()} />
      </OpLayout>
    );
  }

  const data = query.data;
  const summary = data?.summary;
  const empty = !Number(summary?.total ?? 0);

  return (
    <OpLayout current="Dashboard">
      <div className="space-y-6">
        <OpHeader
          title="Operating Procedures & Safe Work Practices"
          subtitle="OSHA 29 CFR 1910.119(f) standard compliance — lifecycle tracking, annual SME certification, Safe Work Practices, and (f)(1) coverage matrix."
          actions={
            <div className="flex gap-2">
              <OpButton variant="secondary" onClick={() => query.refetch()}>
                Refresh
              </OpButton>
              <OpButton href="/operating-procedures/new">New Procedure</OpButton>
            </div>
          }
        />

        {empty ? (
          <OpEmpty
            title="No operating procedures found"
            message="No SOPs or Safe Work Practices exist in the selected company/site scope yet. Create your first procedure or import from templates."
            action={<OpButton href="/operating-procedures/new">Create Procedure</OpButton>}
          />
        ) : null}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <OpMetric
            label="Total Procedures"
            value={summary?.total ?? 0}
            href="/operating-procedures/register"
            tone="neutral"
          />
          <OpMetric
            label="Published"
            value={summary?.published ?? 0}
            href="/operating-procedures/register?status=Published"
            tone="good"
          />
          <OpMetric
            label="In Review / Draft"
            value={(summary?.inReview ?? 0) + (summary?.draft ?? 0)}
            href="/operating-procedures/register?status=In+Review"
            tone="info"
          />
          <OpMetric
            label="Cert. Current %"
            value={`${summary?.certifiedCurrentPct ?? 0}%`}
            href="/operating-procedures/register?status=Published"
            tone={(summary?.certifiedCurrentPct ?? 0) >= 90 ? 'good' : 'warn'}
          />
          <OpMetric
            label="Cert. Overdue"
            value={summary?.overdueCertification ?? 0}
            href="/operating-procedures/register?overdue=true"
            tone={(summary?.overdueCertification ?? 0) > 0 ? 'danger' : 'good'}
          />
          <OpMetric
            label="Safe Work Practices"
            value={summary?.safeWorkPractices ?? 0}
            href="/operating-procedures/register?swp=true"
            tone="info"
          />
        </div>

        {/* Middle row: Upcoming Certifications & Recently Updated */}
        <div className="grid gap-6 xl:grid-cols-2">
          <OpCard
            title="Annual Certification Due / Upcoming"
            subtitle="OSHA 1910.119(f)(3) requires employers to certify annually that procedures are current and accurate."
            action={
              <Link href="/operating-procedures/register?overdue=true" className="text-xs font-semibold text-primary hover:underline">
                View All Due &rarr;
              </Link>
            }
          >
            {data?.upcomingCertifications?.length ? (
              <div className="divide-y divide-[var(--psm-line)]">
                {data.upcomingCertifications.map((proc: OpProcedure) => (
                  <div key={proc.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <Link href={`/operating-procedures/${proc.id}`} className="font-semibold text-[var(--psm-fg)] hover:text-primary">
                        {proc.procedure_number}: {proc.title}
                      </Link>
                      <div className="text-[var(--psm-muted)]">
                        Owner: {proc.owner_user_id ?? 'Unassigned'} | Due: {fmtDate(proc.next_certification_due)}
                      </div>
                    </div>
                    <OpBadge tone={statusTone(proc.certification_status)}>
                      {proc.certification_status}
                    </OpBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-[var(--psm-muted)]">All published procedures are certified current.</p>
            )}
          </OpCard>

          <OpCard
            title="Recently Updated Procedures"
            subtitle="Latest drafts, revisions, and status changes across the site."
            action={
              <Link href="/operating-procedures/register" className="text-xs font-semibold text-primary hover:underline">
                View Register &rarr;
              </Link>
            }
          >
            {data?.recentlyUpdated?.length ? (
              <div className="divide-y divide-[var(--psm-line)]">
                {data.recentlyUpdated.map((proc: OpProcedure) => (
                  <div key={proc.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <Link href={`/operating-procedures/${proc.id}`} className="font-semibold text-[var(--psm-fg)] hover:text-primary">
                        {proc.procedure_number}: {proc.title}
                      </Link>
                      <div className="text-[var(--psm-muted)]">
                        Updated {fmtDate(proc.updated_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <OpBadge tone={criticalityTone(proc.criticality)}>{proc.criticality}</OpBadge>
                      <OpBadge tone={statusTone(proc.procedure_status)}>{proc.procedure_status}</OpBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-[var(--psm-muted)]">No procedure activity recorded.</p>
            )}
          </OpCard>
        </div>

        {/* 1910.119(f)(1) Coverage Matrix */}
        <OpCard
          title="OSHA 1910.119(f)(1) Operating Phase Coverage Matrix"
          subtitle="Audit readiness check: verifies that each operating phase has published procedures per operating unit."
        >
          {data?.coverage?.types?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                    <th className="py-2 pr-4">Procedure Type</th>
                    <th className="py-2 pr-4">OSHA Ref</th>
                    <th className="py-2 pr-4">Category</th>
                    {data.coverage.units.map((u: string) => (
                      <th key={u} className="py-2 pr-4 text-center">Unit: {u}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {data.coverage.types.map((row) => (
                    <tr key={row.type_code} className="hover:bg-[var(--psm-surface-2)]">
                      <td className="py-2.5 pr-4 font-semibold text-[var(--psm-fg)]">{row.type_name}</td>
                      <td className="py-2.5 pr-4 text-[var(--psm-muted)]">{row.osha_reference ?? '-'}</td>
                      <td className="py-2.5 pr-4 text-[var(--psm-muted)]">{row.phase_group}</td>
                      {row.units.map((u) => {
                        const hasPublished = u.published > 0;
                        return (
                          <td key={u.unitId} className="py-2.5 pr-4 text-center">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                                hasPublished
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : u.total > 0
                                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                  : 'bg-danger/10 text-danger border border-danger/20'
                              }`}
                            >
                              {hasPublished ? `${u.published} active` : u.total > 0 ? `${u.total} draft` : 'Gap'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-[var(--psm-muted)]">No coverage data available.</p>
          )}
        </OpCard>
      </div>
    </OpLayout>
  );
}
