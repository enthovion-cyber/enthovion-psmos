import React from 'react';
import Link from 'next/link';
import { Download, Flame, Map, Plus, Radio, ScanLine, ShieldAlert, Zap } from 'lucide-react';

interface PTWQuickActionsProps {
  onRunConflictScan: () => void;
  onExport: () => void;
  running: boolean;
}

export function PTWQuickActions({ onRunConflictScan, onExport, running }: PTWQuickActionsProps) {
  const actions = [
    { label: 'Create New Permit', icon: Plus, href: '/ptw/new', highlight: true },
    { label: 'View Expiring Permits', icon: Flame, href: '/ptw?expiringWithin=2' },
    { label: 'View Suspended Permits', icon: ShieldAlert, href: '/ptw?status=Suspended' },
    { label: 'View Gas Retest Due', icon: Radio, href: '/ptw?gasRetestDue=true' },
    { label: 'View Handover Pending', icon: ScanLine, href: '/ptw?handoverPending=true' },
    { label: 'Open Permit Map', icon: Map, href: '/ptw/map' }
  ];

  return (
    <section className="w-full rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Header Container */}
      <div className="mb-2.5 flex items-center gap-1.5">
        <Zap size={14} className="text-primary dark:text-sky-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Quick Actions
        </h3>
      </div>

      {/* Grid Interface */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Primary Interactive Trigger: Conflict Scan */}
        <button
          className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 px-2 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group shadow-xs active:scale-98"
          disabled={running}
          onClick={onRunConflictScan}
          type="button"
        >
          <ScanLine
            size={13}
            className={`text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors shrink-0 ${
              running ? 'animate-spin text-primary dark:text-blue-400' : ''
            }`}
          />
          <span className="truncate">
            {running ? 'Scanning...' : 'Conflict Scan'}
          </span>
        </button>

        {/* Mapped Navigation Action Paths */}
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all group shadow-xs active:scale-98 ${
              action.highlight
                ? 'border-primary/40 bg-orange-50/70 dark:bg-primary/10 text-primary dark:text-primary hover:bg-orange-100/70 dark:hover:bg-primary/20'
                : 'border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <action.icon
              size={13}
              className={`shrink-0 transition-colors ${
                action.highlight
                  ? 'text-primary'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400'
              }`}
            />
            <span className="truncate">{action.label}</span>
          </Link>
        ))}

        {/* Secondary Interactive Trigger: Report Export */}
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 px-2 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 group col-span-2 shadow-xs active:scale-98"
          onClick={onExport}
          type="button"
        >
          <Download
            size={13}
            className="text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors shrink-0"
          />
          <span className="truncate">Export PTW Report</span>
        </button>
      </div>
    </section>
  );
}
