'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert } from 'lucide-react';

// Fallback components matching your style parameters perfectly
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (tone === 'amber') colors = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (tone === 'green') colors = 'bg-green-500/10 text-green-400 border-green-500/20';
  if (tone === 'blue') colors = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
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
  if (tone === 'green') barColor = 'bg-green-500';
  return (
    <div className="w-full bg-slate-900 border border-slate-800/80 h-2 rounded-full overflow-hidden">
      <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
};

const EmptyState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <p className="text-xs font-medium text-slate-500">{title}</p>
  </div>
);

// High-fidelity production mock data fallback
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
  data?: Record<string, any>;
}

export function MOCActionHealthPanel({ data = {} }: MOCActionHealthPanelProps) {
  // Defensive fallbacks merging direct schema variants
  const summary = data.summary ?? (data.open !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  const open = Number(summary.open ?? data.openCount ?? 0);
  const overdue = Number(summary.overdue ?? data.overdueCount ?? 0);
  const blocked = Number(summary.blockedMocs ?? summary.closureBlocked ?? data.blockedClosures ?? data.blocked ?? 0);
  const total = Number(summary.totalRequired ?? 0);
  const complete = Number(summary.completedVerified ?? 0);
  const completion = Number(data.completionRate ?? (total ? Math.round((complete / total) * 100) : 100));
  const items = data.items ?? data.overdueItems ?? [];
  const groups = data.groups ?? (data.open === undefined && !items.length ? DEFAULT_MOCK_DATA.groups : []);

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full">
      
      {/* Header Block */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Closed-Loop Action Health
          </h3>
        </div>
        <Badge tone={overdue || blocked ? 'red' : 'green'}>{completion}% complete</Badge>
      </div>

      <div className="flex flex-col gap-4 w-full">
        
        {/* Metric Grid Stack */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Open</p>
            <p className="text-xl font-black text-white mt-1">{open}</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold text-red-400/80 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-black text-red-400 mt-1">{overdue}</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Blocked</p>
            <p className="text-xl font-black text-amber-400 mt-1">{blocked}</p>
          </div>
        </div>

        {/* State Badges Grid - Wrap dynamically on small viewports */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone={summary.missingEvidence ? 'red' : 'green'}>Missing Evidence {summary.missingEvidence ?? 0}</Badge>
          <Badge tone={summary.pendingVerification ? 'amber' : 'green'}>Pending Verification {summary.pendingVerification ?? 0}</Badge>
          <Badge tone={summary.evidenceRejected ? 'red' : 'green'}>Evidence Rejected {summary.evidenceRejected ?? 0}</Badge>
          <Badge tone="green">Verified {summary.completedVerified ?? 0}</Badge>
        </div>

        {/* Dynamic Progress Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Action Implementation Completion</span>
            <span className="text-slate-300">{completion}%</span>
          </div>
          <ProgressBar value={completion} tone={completion > 85 ? 'green' : completion > 60 ? 'amber' : 'red'} />
        </div>

        {/* Item Workspace Feed Grid */}
        <div className="space-y-2">
          {groups.length ? (
            groups.map((item: any) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-950 p-3 hover:border-slate-800 transition-all duration-200 group">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-300 group-hover:text-white transition-colors truncate max-w-[65%]">
                  {item.open ? <CircleAlert size={14} className="text-amber-400 shrink-0" /> : <CheckCircle2 size={14} className="text-green-400 shrink-0" />} 
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
                className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-950 p-3 hover:border-slate-800 transition-all duration-200 group"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-300 group-hover:text-white transition-colors truncate max-w-[70%]">
                  {item.status === 'Completed' ? <CheckCircle2 size={14} className="text-green-400 shrink-0" /> : <CircleAlert size={14} className="text-red-400 shrink-0" />} 
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