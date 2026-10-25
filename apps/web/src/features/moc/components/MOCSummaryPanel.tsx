'use client';

import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, GraduationCap, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, DetailCard, ProgressBar, riskTone, statusTone } from './moc-detail-ui';

export function MOCSummaryPanel({ moc, onTriggerPssr }: { moc: any; onTriggerPssr: () => void }) {
  const summary = moc.summary ?? {};
  const blockers = summary.startupBlockers ?? [];

  return (
    <div className="space-y-4">
      {/* Change Health & Progress */}
      <DetailCard title="Change Health & Readiness">
        <div className="space-y-3.5">
          <Line label="Current Status">
            <Badge tone={statusTone(moc.status)}>{moc.status}</Badge>
          </Line>
          <Line label="Risk Level">
            <Badge tone={riskTone(moc.risk_level)}>{moc.risk_level}</Badge>
          </Line>
          <Progress label="Approval Progress" value={summary.approvalProgress?.percent ?? 0} />
          <Progress label="Closed-Loop Actions" value={summary.requiredActionCompletion?.percent ?? 100} tone="green" />
          <Progress label="Engineering Package" value={summary.engineeringPackageReadiness?.percent ?? 0} tone="amber" />
          <Progress label="Impact Assessment" value={summary.impactCompletion?.percent ?? 0} />
          <Line label="Temporary Expiry">
            {summary.temporaryDaysRemaining === null || summary.temporaryDaysRemaining === undefined
              ? 'N/A'
              : `${summary.temporaryDaysRemaining} days`}
          </Line>
          <Line label="PSSR Status">
            {summary.pssrStatus?.required ? (
              <Badge tone="amber">{summary.pssrStatus.status ?? 'Required'}</Badge>
            ) : (
              <Badge tone="green">Not Required</Badge>
            )}
          </Line>
          <Line label="Training Completed">
            {summary.trainingStatus?.completed ?? 0} / {summary.trainingStatus?.total ?? 0}
          </Line>
          <Line label="Documents Approved">
            {summary.documentReadiness?.complete ?? 0} / {summary.documentReadiness?.total ?? 0}
          </Line>
        </div>
      </DetailCard>

      {/* Startup Blockers */}
      <DetailCard title="Startup Gate Blockers">
        {blockers.length ? (
          <div className="space-y-2">
            {blockers.map((item: any, index: number) => (
              <div
                key={`${item.title ?? index}`}
                className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{item.title ?? String(item)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={15} />
            <span>No active startup blockers</span>
          </div>
        )}
      </DetailCard>

      {/* Quick Actions */}
      <DetailCard title="Quick Actions">
        <div className="grid gap-2">
          <Quick
            icon={<ShieldAlert size={14} className="text-primary" />}
            label="Trigger PSSR Review"
            onClick={onTriggerPssr}
          />
          <Quick
            icon={<ClipboardCheck size={14} className="text-emerald-500" />}
            label="View Action Center"
            onClick={() => window.open('/actions', '_blank')}
          />
          <Quick
            icon={<GraduationCap size={14} className="text-blue-500" />}
            label="Training Requirements"
            onClick={() => window.open(`/moc/${moc.id}#training`, '_self')}
          />
        </div>
      </DetailCard>
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--psm-line)] pb-2 text-xs">
      <span className="text-[var(--psm-muted)]">{label}</span>
      <span className="font-bold text-[var(--psm-fg)]">{children}</span>
    </div>
  );
}

function Progress({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[var(--psm-muted)]">{label}</span>
        <span className="font-bold text-[var(--psm-fg)]">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

function Quick({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-left text-xs font-bold text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)] transition-colors focus:outline-none"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
