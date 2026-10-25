'use client';

import { AlertTriangle, CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import { Badge, DetailCard, Metric, ProgressBar, riskTone } from '../moc-detail-ui';

export function RiskSummaryCard({ risk, summary, readOnly }: { risk: any; summary?: any; readOnly?: boolean }) {
  const score = Number(risk?.total_score ?? 0);
  const level = risk?.risk_level ?? 'Low';

  return (
    <DetailCard
      title="Process Safety & HAZOP Risk Summary"
      action={<Badge tone={readOnly ? 'slate' : riskTone(level)}>{readOnly ? 'Locked / Read-Only' : risk?.status ?? 'Draft'}</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total Risk Score" value={`${score} / 9`} tone={riskTone(level)} sub={`${level} Risk Level`} />
        <Metric label="Required Safety Reviews" value={summary?.requiredReviews ?? 0} tone="blue" sub="Auto-determined by engine" />
        <Metric
          label="Approval Blockers"
          value={summary?.approvalBlockingReviews ?? 0}
          tone={summary?.approvalBlockingReviews ? 'amber' : 'green'}
          sub="Required before approval"
        />
        <Metric
          label="Startup Gate Blockers"
          value={summary?.startupBlockingReviews ?? 0}
          tone={summary?.startupBlockingReviews ? 'red' : 'green'}
          sub="Required before startup"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Risk Position Breakdown */}
        <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 transition-colors">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
            <span>Overall Risk Exposure</span>
            <span className="font-mono">{Math.round(score * 11.11)}%</span>
          </div>
          <ProgressBar
            value={score * 11.11}
            tone={level === 'Critical' || level === 'High' ? 'red' : level === 'Medium' ? 'amber' : 'green'}
          />
          <div className="mt-3.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2.5">
              <span className="text-[var(--psm-muted)] block text-[10px] uppercase font-bold">Safety Impact</span>
              <span className="font-bold text-[var(--psm-fg)] text-sm">{risk?.safety_label ?? '0 - None'}</span>
            </div>
            <div className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2.5">
              <span className="text-[var(--psm-muted)] block text-[10px] uppercase font-bold">Environmental</span>
              <span className="font-bold text-[var(--psm-fg)] text-sm">{risk?.environmental_label ?? '0 - None'}</span>
            </div>
            <div className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2.5">
              <span className="text-[var(--psm-muted)] block text-[10px] uppercase font-bold">Production Impact</span>
              <span className="font-bold text-[var(--psm-fg)] text-sm">{risk?.production_label ?? '0 - None'}</span>
            </div>
          </div>
        </div>

        {/* Risk Governance Directive */}
        <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 transition-colors">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--psm-fg)]">
            {level === 'Critical' ? (
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            ) : readOnly ? (
              <Lock className="h-4 w-4 text-[var(--psm-muted)]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
            Governance Directive
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--psm-muted)]">
            {level === 'Critical'
              ? 'Critical risk rating mandates formal HAZOP / PHA revalidation, plant manager sign-off, and comprehensive PSSR startup gating.'
              : level === 'High'
              ? 'High risk change requires multi-disciplinary engineering evaluation and enhanced approval routing before proceeding.'
              : readOnly
              ? 'This risk ranking is locked by workflow sign-off or the MOC state is in read-only mode.'
              : 'Evaluate the three risk vectors below to compute the automated baseline risk ranking and downstream review triggers.'}
          </p>
          {(summary?.validationErrors ?? []).length ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-rose-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              {summary.validationErrors.length} validation requirement(s) pending
            </p>
          ) : null}
        </div>
      </div>
    </DetailCard>
  );
}
