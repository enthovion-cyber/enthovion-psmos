'use client';

import React from 'react';
import Link from 'next/link';
import { Siren } from 'lucide-react';

// Unified high-fidelity production badge matching global dashboard system parameters
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (tone === 'green') colors = 'bg-green-500/10 text-green-400 border-green-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

interface MOCCriticalRiskAlertProps {
  items?: Array<Record<string, any>>;
}

export function MOCCriticalRiskAlert({ items = [] }: MOCCriticalRiskAlertProps) {
  return (
    // Uses h-auto to naturally adapt to the number of critical items without trigger scrollbars
    <div className="w-full h-auto rounded-xl border border-red-950 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-start">
      
      {/* Header Area Block */}
      <div className="mb-4 flex items-center justify-between border-b border-red-950/40 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Siren size={16} className={items.length ? 'text-red-400 animate-pulse' : 'text-slate-500'} />
          <h3 className="text-base font-bold tracking-tight text-white">
            Critical Risk Alerts
          </h3>
        </div>
        <Badge tone={items.length ? 'red' : 'green'}>
          {items.length ? `${items.length} critical` : 'Clear'}
        </Badge>
      </div>

      {/* Main Alerts Row Stack Layout */}
      <div className="flex flex-col gap-2.5 w-full">
        {items.length ? (
          items.map((item) => (
            <Link 
              key={item.id} 
              href={item.href ?? `/moc/${item.id}`} 
              className="block rounded-xl border border-red-500/10 bg-red-500/[0.02] p-3.5 hover:border-red-500/30 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-red-900"
            >
              {/* Upper Line Frame */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-950/20 pb-2 mb-2.5">
                <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors truncate">
                  <span className="text-red-400 mr-1.5 font-black">{item.mocNumber}</span>
                  <span className="text-slate-500 font-normal mx-1">·</span>
                  <span>{item.title}</span>
                </p>
                <div className="flex justify-start">
                  <Badge tone="red">{item.currentWorkflowStep ?? 'Workflow'}</Badge>
                </div>
              </div>

              {/* Dynamic Responsive Subtext Specifications Grid */}
              <div className="grid gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-400 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Unit/Area:</span> 
                  <span className="text-slate-300">{item.unit ?? '-'} / {item.area ?? '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Plant Mgr Notified:</span> 
                  <span className={item.plantManagerNotified ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {item.plantManagerNotified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">HAZOP Required:</span> 
                  <span className="text-slate-300">{item.hazopRequired ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">PSSR Required:</span> 
                  <span className="text-slate-300">{item.pssrRequired ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-1">
                  <span className="text-slate-600">Startup Blocked:</span> 
                  <span className={item.startupBlocked ? 'text-red-400 font-bold' : 'text-slate-400'}>
                    {item.startupBlocked ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center w-full">
            <p className="text-xs font-medium text-slate-500">No critical risk MOCs</p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">Critical risk items will isolate and display here automatically.</p>
          </div>
        )}
      </div>

    </div>
  );
}