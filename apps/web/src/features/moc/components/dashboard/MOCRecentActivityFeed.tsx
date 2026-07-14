'use client';

import React from 'react';
import Link from 'next/link';
import { History, FileText, CheckCircle2, AlertTriangle, User } from 'lucide-react';

// Unified high-fidelity badge indicator matching global dashboard system parameters
const StatusBadge = ({ type }: { type: string }) => {
  let styles = 'bg-slate-900 text-slate-400 border-slate-800';
  if (type === 'create') styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (type === 'approve') styles = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  if (type === 'reject') styles = 'bg-red-500/10 text-red-400 border-red-500/20';
  
  const label = type === 'create' ? 'Created' : type === 'approve' ? 'Approved' : type === 'reject' ? 'Rejected' : 'Updated';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${styles}`}>
      {label}
    </span>
  );
};

// High-fidelity operational audit fallback simulation data (Context Year 2026)
const DEFAULT_MOCK_DATA = [
  { id: 'act-1', type: 'create', mocNumber: 'MOC-2026-142', details: 'Initial process layout design submittal', user: 'E. Chevalier', timestamp: '10m ago' },
  { id: 'act-2', type: 'approve', mocNumber: 'MOC-2026-089', details: 'PSSR checklist verification sign-off', user: 'M. Tanaka', timestamp: '1h ago' },
  { id: 'act-3', type: 'reject', mocNumber: 'MOC-2026-112', details: 'Bypass valve modification documentation missing', user: 'A. Vance', timestamp: '3h ago' },
  { id: 'act-4', type: 'update', mocNumber: 'MOC-2026-034', details: 'Emergency procedure text update revision v2', user: 'J. Doe', timestamp: '5h ago' },
  { id: 'act-5', type: 'approve', mocNumber: 'MOC-2026-021', details: 'Mechanical integrity review approved', user: 'S. Patel', timestamp: '1d ago' }
];

interface MOCRecentActivityPanelProps {
  data?: Record<string, any> | any[];
}

export function MOCRecentActivityFeed({ data }: MOCRecentActivityPanelProps) {
  // Gracefully fallback to production dataset array elements
  const items = Array.isArray(data) ? data : (data?.items ?? data?.activities ?? DEFAULT_MOCK_DATA);

  // Hard clamp feed layout directly to 4 rows to keep grid heights perfectly unified
  const displayedItems = items.slice(0, 4);

  return (
    <div className="w-full h-auto rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-start">
      
      {/* Component Upper Control Header Frame */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Recent Activity
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-800 uppercase tracking-wider">
          Audit Trail Log
        </span>
      </div>

      {/* Main Structural Feed Wrapper (Auto heights, zero inner scroll overflow) */}
      <div className="flex flex-col gap-2 w-full">
        {displayedItems.length ? (
          displayedItems.map((item: any) => {
            // Evaluates domain action category layout configurations
            const ActionIcon = item.type === 'create' ? FileText : item.type === 'approve' ? CheckCircle2 : AlertTriangle;
            const iconColor = item.type === 'create' ? 'text-emerald-400' : item.type === 'approve' ? 'text-sky-400' : 'text-amber-400';

            return (
              <div 
                key={item.id} 
                className="flex items-start gap-3 rounded-xl border border-slate-900 bg-slate-900/20 p-3 transition-colors duration-150 hover:bg-slate-900/40 hover:border-slate-800/60"
              >
                {/* Structural Icon Node Context Block */}
                <div className={`mt-0.5 rounded-lg bg-slate-950 p-1.5 border border-slate-900 ${iconColor} shrink-0`}>
                  <ActionIcon size={14} />
                </div>

                {/* Main Text Content Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-200 truncate hover:text-white transition-colors">
                      {item.mocNumber ?? item.moc_number}
                    </span>
                    <StatusBadge type={item.type} />
                  </div>
                  
                  <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-1.5">
                    {item.details ?? item.message}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <User size={10} className="text-slate-600" /> {item.user ?? item.operator}
                    </span>
                    <span className="text-slate-600 font-normal">
                      {item.timestamp ?? item.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center w-full">
            <p className="text-xs font-medium text-slate-500">No recent entries recorded</p>
          </div>
        )}

        {/* Global Operational History Navigation Action */}
        <div className="mt-2 pt-2 border-t border-slate-900/80 shrink-0">
          <Link
            href="/moc/history"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-900 bg-slate-900/30 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-800 hover:bg-slate-900/80 transition-all duration-200 focus:outline-none"
          >
            <History size={13} className="text-slate-500" />
            <span>View Full History Ledger</span>
          </Link>
        </div>

      </div>

    </div>
  );
}