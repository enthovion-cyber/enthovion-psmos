'use client';

import type { ReactNode } from 'react';
import { Badge, DetailCard, EmptyState, Metric, ProgressBar, riskTone, statusTone } from '../moc-detail-ui';

export function MOCOverviewTab({ moc }: { moc: any }) {
  const summary = moc.summary ?? {};
  const primary = moc.equipment?.find((item: any) => item.role === 'PRIMARY');
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2 grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Risk Score" value={moc.risk_score ?? 0} tone={riskTone(moc.risk_level)} sub={moc.risk_level} />
          <Metric label="Approval" value={`${summary.approvalProgress?.percent ?? 0}%`} tone="blue" sub={moc.status} />
          <Metric label="Actions" value={`${summary.requiredActionCompletion?.completed ?? 0}/${summary.requiredActionCompletion?.total ?? 0}`} tone="green" sub={`${summary.requiredActionCompletion?.percent ?? 100}% complete`} />
          <Metric label="Documents" value={`${summary.documentReadiness?.complete ?? 0}/${summary.documentReadiness?.total ?? 0}`} tone="amber" sub="readiness" />
        </div>
        <DetailCard title="MOC Summary">
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Change Type" value={moc.change_type} />
            <Info label="Change Category" value={moc.change_category} />
            <Info label="Current Status" value={<Badge tone={statusTone(moc.status)}>{moc.status}</Badge>} />
            <Info label="Risk Level" value={<Badge tone={riskTone(moc.risk_level)}>{moc.risk_level}</Badge>} />
            <Info label="Originator" value={moc.originator?.displayName ?? moc.originator_id ?? '-'} />
            <Info label="Department" value={moc.department?.name ?? '-'} />
            <Info label="Site / Unit / Area" value={`${moc.site?.name ?? '-'} / ${moc.unit?.name ?? '-'} / ${moc.area?.name ?? '-'}`} />
            <Info label="Target Implementation" value={moc.target_implementation_date ?? '-'} />
            <Info label="Primary Equipment" value={primary?.equipment?.tag ?? '-'} />
            <Info label="Related Equipment" value={`${Math.max(0, (moc.equipment?.length ?? 0) - 1)} related`} />
          </div>
        </DetailCard>
        <DetailCard title="Readiness Cards">
          <div className="grid gap-3 md:grid-cols-3">
            <Readiness title="Impact Completion" value={summary.impactCompletion?.percent ?? 0} />
            <Readiness title="Approval Status" value={summary.approvalProgress?.percent ?? 0} />
            <Readiness title="Engineering Package" value={summary.engineeringPackageReadiness?.percent ?? 0} tone="amber" />
            <Readiness title="PSSR Status" value={summary.pssrStatus?.required ? summary.pssrStatus.readiness_score ?? 0 : 100} tone={summary.pssrStatus?.required ? 'amber' : 'green'} />
            <Readiness title="Startup Blockers" value={summary.startupBlockers?.length ? 0 : 100} tone={summary.startupBlockers?.length ? 'red' : 'green'} />
            <Readiness title="Training" value={summary.trainingStatus?.total ? Math.round((summary.trainingStatus.completed / summary.trainingStatus.total) * 100) : 100} tone="green" />
          </div>
        </DetailCard>
      </div>
      <div className="grid gap-4">
        <DetailCard title="Linked Equipment">
          {moc.equipment?.length ? <div className="space-y-2">{moc.equipment.map((item: any) => <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="font-bold text-white">{item.equipment?.tag}</p><p className="text-sm text-slate-400">{item.equipment?.name} / {item.role}</p></div>)}</div> : <EmptyState title="No linked equipment" />}
        </DetailCard>
        <DetailCard title="Recent Activity">
          {summary.latestHistory?.length ? <div className="space-y-3">{summary.latestHistory.map((item: any) => <div key={item.id} className="border-l border-blue-300/40 pl-3"><p className="font-bold text-white">{item.title}</p><p className="text-xs text-slate-500">{item.created_at}</p></div>)}</div> : <EmptyState title="No history yet" />}
        </DetailCard>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><div className="mt-1 font-bold text-white">{value}</div></div>;
}

function Readiness({ title, value, tone = 'blue' }: { title: string; value: number; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="mb-2 flex justify-between text-sm"><span className="font-bold text-white">{title}</span><span className="text-slate-300">{value}%</span></div><ProgressBar value={value} tone={tone} /></div>;
}
