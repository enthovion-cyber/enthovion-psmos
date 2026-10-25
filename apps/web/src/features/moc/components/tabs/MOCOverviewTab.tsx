'use client';

import type { ReactNode } from 'react';
import { Badge, DetailCard, EmptyState, InfoBox, Metric, ProgressBar, riskTone, statusTone } from '../moc-detail-ui';

export function MOCOverviewTab({ moc }: { moc: any }) {
  const summary = moc.summary ?? {};
  const primary = moc.equipment?.find((item: any) => item.role === 'PRIMARY');

  return (
    <div className="space-y-6 w-full">
      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 w-full">
        <Metric
          label="Risk Score"
          value={`${moc.risk_score ?? 0} / 9`}
          tone={riskTone(moc.risk_level)}
          sub={`${moc.risk_level ?? 'Low'} Risk`}
        />
        <Metric
          label="Approval Progress"
          value={`${summary.approvalProgress?.percent ?? 0}%`}
          tone="blue"
          sub={moc.status}
        />
        <Metric
          label="Closed Actions"
          value={`${summary.requiredActionCompletion?.completed ?? 0} / ${summary.requiredActionCompletion?.total ?? 0}`}
          tone="green"
          sub={`${summary.requiredActionCompletion?.percent ?? 100}% closed`}
        />
        <Metric
          label="PSI & Docs"
          value={`${summary.documentReadiness?.complete ?? 0} / ${summary.documentReadiness?.total ?? 0}`}
          tone="amber"
          sub="Readiness verified"
        />
      </div>

      {/* Main Overview & Readiness Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
        {/* Core Metadata */}
        <DetailCard title="MOC Metadata & Scope">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoBox label="Change Type" value={moc.change_type} />
            <InfoBox label="Change Category" value={moc.change_category} />
            <InfoBox label="Current Status" value={<Badge tone={statusTone(moc.status)}>{moc.status}</Badge>} />
            <InfoBox label="Risk Level" value={<Badge tone={riskTone(moc.risk_level)}>{moc.risk_level}</Badge>} />
            <InfoBox label="Originator" value={moc.originator?.displayName ?? moc.originator_id ?? '-'} />
            <InfoBox label="Department" value={moc.department?.name ?? '-'} />
            <InfoBox label="Site / Unit / Area" value={`${moc.site?.name ?? '-'} / ${moc.unit?.name ?? '-'} / ${moc.area?.name ?? '-'}`} />
            <InfoBox label="Target Implementation" value={moc.target_implementation_date ?? '-'} />
            <InfoBox label="Primary Equipment" value={primary?.equipment?.tag ?? 'None linked'} />
            <InfoBox label="Associated Equipment" value={`${Math.max(0, (moc.equipment?.length ?? 0) - 1)} secondary asset(s)`} />
          </div>
        </DetailCard>

        {/* Readiness Gates Progress */}
        <DetailCard title="Readiness & Compliance Gates">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReadinessCard title="Impact Assessment" value={summary.impactCompletion?.percent ?? 0} />
            <ReadinessCard title="Workflow Approvals" value={summary.approvalProgress?.percent ?? 0} />
            <ReadinessCard title="Engineering Package" value={summary.engineeringPackageReadiness?.percent ?? 0} tone="amber" />
            <ReadinessCard
              title="PSSR Readiness"
              value={summary.pssrStatus?.required ? summary.pssrStatus.readiness_score ?? 0 : 100}
              tone={summary.pssrStatus?.required ? 'amber' : 'green'}
            />
            <ReadinessCard
              title="Startup Blocker Status"
              value={summary.startupBlockers?.length ? 0 : 100}
              tone={summary.startupBlockers?.length ? 'red' : 'green'}
            />
            <ReadinessCard
              title="Training & Competency"
              value={summary.trainingStatus?.total ? Math.round((summary.trainingStatus.completed / summary.trainingStatus.total) * 100) : 100}
              tone="green"
            />
          </div>
        </DetailCard>
      </div>

      {/* Linked Equipment & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
        {/* Linked Equipment */}
        <DetailCard title="Linked Equipment Registry Assets">
          {moc.equipment?.length ? (
            <div className="space-y-2.5">
              {moc.equipment.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-[var(--psm-fg)]">
                      {item.equipment?.tag ?? 'Tag Missing'}
                    </p>
                    <p className="mt-0.5 text-[var(--psm-muted)]">
                      {item.equipment?.name ?? 'Asset'} · System: {item.equipment?.system ?? '-'}
                    </p>
                  </div>
                  <Badge tone={item.role === 'PRIMARY' ? 'blue' : 'slate'}>{item.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No linked equipment tags" detail="Link equipment assets in Change Details or Engineering Package." />
          )}
        </DetailCard>

        {/* Recent Activity */}
        <DetailCard title="Recent MOC Activity History">
          {summary.latestHistory?.length ? (
            <div className="space-y-3">
              {summary.latestHistory.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border-l-2 border-primary bg-[var(--psm-surface-2)] p-3 text-xs transition-colors"
                >
                  <p className="font-bold text-[var(--psm-fg)]">{item.title}</p>
                  <p className="mt-1 text-[var(--psm-muted)]">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent activity logged" detail="Audit events will appear as the MOC transitions through stages." />
          )}
        </DetailCard>
      </div>
    </div>
  );
}

function ReadinessCard({
  title,
  value,
  tone = 'blue'
}: {
  title: string;
  value: number;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 transition-colors">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--psm-fg)]">{title}</span>
        <span className="font-mono font-bold text-[var(--psm-muted)]">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}
