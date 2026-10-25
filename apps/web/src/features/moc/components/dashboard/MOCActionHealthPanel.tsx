'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert } from 'lucide-react';

const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  if (tone === 'amber') colors = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  if (tone === 'green') colors = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (tone === 'blue') colors = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, tone }: { value: number; tone: string }) => {
  let barColor = 'bg-slate-500';
  if (tone === 'red') barColor = 'bg-red-500';
  if (tone === 'amber') barColor = 'bg-amber-400';
  if (tone === 'green') barColor = 'bg-emerald-500';
  return (
    <div className="w-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)] h-2 rounded-full overflow-hidden">
      <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
};

const EmptyState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <p className="text-xs font-medium text-[var(--psm-muted)]">{title}</p>
  </div>
);

const DEFAULT_MOCK_DATA = {
  summary: {
    open: 8,
    overdue: 3,
    blockedMocs: 1,
    totalRequired: 24,
    completedVerified: 15,
    missingEvidence: 2,
    pendingVerification: 4,
    evidenceRejected: 1,
  },
  groups: [
    { label: 'Pre-Startup Safety Actions', open: 3, overdue: 1 },
    { label: 'Operations Training Updates', open: 2, overdue: 0 },
    { label: 'P&ID Engineering Sign-Offs', open: 3, overdue: 2 },
  ]
};

interface MOCActionHealthPanelProps {
  data?: Record<string, any> | undefined;
}

export function MOCActionHealthPanel({ data = {} }: MOCActionHealthPanelProps) {
  const summary = data?.summary ?? (data?.open !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  const open = Number(summary?.open ?? data?.openCount ?? 0);
  const overdue = Number(summary?.overdue ?? data?.overdueCount ?? 0);
  const blocked = Number(summary?.blockedMocs ?? summary?.closureBlocked ?? data?.blockedClosures ?? data?.blocked ?? 0);
  const total = Number(summary?.totalRequired ?? 0);
  const complete = Number(summary?.completedVerified ?? 0);
  const completion = Number(data?.completionRate ?? (total ? Math.round((complete / total) * 100) : 100));
  const items = data?.items ?? data?.overdueItems ?? [];
  const groups = data?.groups ?? (data?.open === undefined && !items.length ? DEFAULT_MOCK_DATA.groups : []);

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full text-[var(--psm-fg)]">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-2">
        <h3 className="text-base font-bold tracking-tight text-[var(--psm-fg)]">
          Closed-Loop Action Health
        </h3>
        <Badge tone={overdue || blocked ? 'red' : 'green'}>{completion}% complete</Badge>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-[10px] font-semibold text-[var(--psm-muted)] uppercase tracking-wider">Open</p>
            <p className="text-xl font-black text-[var(--psm-fg)] mt-1">{open}</p>
          </div>
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{overdue}</p>
          </div>
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Blocked</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{blocked}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone={summary?.missingEvidence ? 'red' : 'green'}>Missing Evidence {summary?.missingEvidence ?? 0}</Badge>
          <Badge tone={summary?.pendingVerification ? 'amber' : 'green'}>Pending Verification {summary?.pendingVerification ?? 0}</Badge>
          <Badge tone={summary?.evidenceRejected ? 'red' : 'green'}>Evidence Rejected {summary?.evidenceRejected ?? 0}</Badge>
          <Badge tone="green">Verified {summary?.completedVerified ?? 0}</Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-[var(--psm-muted)] uppercase tracking-wider">
            <span>Action Implementation Completion</span>
            <span className="text-[var(--psm-fg)]">{completion}%</span>
          </div>
          <ProgressBar value={completion} tone={completion > 85 ? 'green' : completion > 60 ? 'amber' : 'red'} />
        </div>

        <div className="space-y-2">
          {groups.length ? (
            groups.map((item: any) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary/50 transition-all group">
                <span className="flex items-center gap-2 text-xs font-semibold text-[var(--psm-fg)] group-hover:text-primary transition-colors truncate max-w-[65%]">
                  {item.open ? <CircleAlert size={14} className="text-amber-500 shrink-0" /> : <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />} 
                  <span className="truncate">{item.label}</span>
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <Badge tone="blue">{item.open} open</Badge>
                  <Badge tone={item.overdue ? 'red' : 'green'}>{item.overdue} overdue</Badge>
                </div>
              </div>
            ))
          ) : items.length ? (
            items.slice(0, 4).map((item: any) => (
              <Link 
                key={item.id} 
                href={`/moc/${item.moc_id ?? item.mocId}`} 
                className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary/50 transition-all group"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-[var(--psm-fg)] group-hover:text-primary transition-colors truncate max-w-[70%]">
                  {item.status === 'Completed' ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <CircleAlert size={14} className="text-red-500 shrink-0" />} 
                  <span className="truncate">{item.title ?? item.action_title}</span>
                </span>
                <Badge tone="red">{item.due_date ?? item.dueDate ?? 'Due'}</Badge>
              </Link>
            ))
          ) : (
            <EmptyState title="No overdue MOC actions" />
          )}
        </div>
      </div>
    </div>
  );
}
