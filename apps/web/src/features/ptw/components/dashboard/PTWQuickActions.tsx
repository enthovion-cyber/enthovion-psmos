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
    { label: 'Create New Permit', icon: Plus, href: '/ptw/new' },
    { label: 'View Expiring Permits', icon: Flame, href: '/ptw?expiringWithin=2' },
    { label: 'View Suspended Permits', icon: ShieldAlert, href: '/ptw?status=Suspended' },
    { label: 'View Gas Retest Due', icon: Radio, href: '/ptw?gasRetestDue=true' },
    { label: 'View Handover Pending', icon: ScanLine, href: '/ptw?handoverPending=true' },
    { label: 'Open Permit Map', icon: Map, href: '/ptw/map' }
  ];

  return (
    <section className="w-full max-w-lg rounded-xl border border-slate-800/80 bg-[#070f1e] p-5 shadow-2xl select-none">
      
      {/* Header Container */}
      <div className="mb-4 flex items-center gap-2">
        <Zap size={16} className="text-blue-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>

      {/* Responsive Grid Interface Workspace */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        
        {/* Primary Interactive Trigger: Conflict Scan */}
        <button 
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/10 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-900/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          disabled={running} 
          onClick={onRunConflictScan}
        >
          <ScanLine 
            size={14} 
            className={`text-slate-400 group-hover:text-blue-400 transition-colors ${running ? 'animate-spin text-blue-400' : ''}`} 
          /> 
          <span className="truncate">
            {running ? 'Running Conflict Scan...' : 'Run Conflict Scan'}
          </span>
        </button>

        {/* Mapped Navigation Action Paths */}
        {actions.map((action) => (
          <Link 
            key={action.label} 
            href={action.href}
            className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/10 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-900/30 group"
          >
            <action.icon 
              size={14} 
              className="text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" 
            /> 
            <span className="truncate">{action.label}</span>
          </Link>
        ))}

        {/* Secondary Interactive Trigger: Report Export */}
        <button 
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/10 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-900/30 group sm:col-span-2"
          onClick={onExport}
        >
          <Download 
            size={14} 
            className="text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" 
          /> 
          <span className="truncate">Export PTW Report</span>
        </button>

      </div>

    </section>
  );
}