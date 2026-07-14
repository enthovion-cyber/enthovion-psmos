'use client';

import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, GraduationCap, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, DetailCard, ProgressBar, riskTone, statusTone } from './moc-detail-ui';

export function MOCSummaryPanel({ moc, onTriggerPssr }: { moc: any; onTriggerPssr: () => void }) {
  const summary = moc.summary ?? {};
  const blockers = summary.startupBlockers ?? [];
  return (
    <aside className="space-y-3">
      <DetailCard title="Right Summary Panel">
        <div className="space-y-3">
          <Line label="Current Status"><Badge tone={statusTone(moc.status)}>{moc.status}</Badge></Line>
          <Line label="Risk Level"><Badge tone={riskTone(moc.risk_level)}>{moc.risk_level}</Badge></Line>
          <Progress label="Approval Progress" value={summary.approvalProgress?.percent ?? 0} />
          <Progress label="Closed-Loop Actions" value={summary.requiredActionCompletion?.percent ?? 100} tone="green" />
          <Progress label="Engineering Package" value={summary.engineeringPackageReadiness?.percent ?? 0} tone="amber" />
          <Progress label="Impact Assessment" value={summary.impactCompletion?.percent ?? 0} />
          <Line label="Temporary Expiry">{summary.temporaryDaysRemaining === null || summary.temporaryDaysRemaining === undefined ? '-' : `${summary.temporaryDaysRemaining} days`}</Line>
          <Line label="PSSR Status">{summary.pssrStatus?.required ? <Badge tone="amber">{summary.pssrStatus.status}</Badge> : <Badge tone="green">Not Required</Badge>}</Line>
          <Line label="Training Status">{summary.trainingStatus?.completed ?? 0} / {summary.trainingStatus?.total ?? 0}</Line>
          <Line label="Document Readiness">{summary.documentReadiness?.complete ?? 0} / {summary.documentReadiness?.total ?? 0}</Line>
        </div>
      </DetailCard>
      <DetailCard title="Startup Blockers">
        {blockers.length ? <div className="space-y-2">{blockers.map((item: any, index: number) => <div key={`${item.title}-${index}`} className="flex gap-2 rounded-lg border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-100"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{item.title ?? String(item)}</div>)}</div> : <div className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100"><CheckCircle2 size={16} /> No active startup blockers</div>}
      </DetailCard>
      <DetailCard title="Quick Actions">
        <div className="grid gap-2">
          <Quick icon={<ClipboardCheck size={15} />} label="Create Required Actions" />
          <Quick icon={<ShieldAlert size={15} />} label="Trigger PSSR" onClick={onTriggerPssr} />
          <Quick icon={<GraduationCap size={15} />} label="Create Training Requirement" />
          <Quick icon={<FileText size={15} />} label="Download MOC Report" />
        </div>
      </DetailCard>
    </aside>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 text-sm"><span className="text-slate-400">{label}</span><span className="font-bold text-white">{children}</span></div>;
}

function Progress({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  return <div><div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-bold text-white">{value}%</span></div><ProgressBar value={value} tone={tone} /></div>;
}

function Quick({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm font-bold text-slate-200 hover:border-blue-300/50">{icon}{label}</button>;
}
