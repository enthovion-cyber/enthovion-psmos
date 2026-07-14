import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, BellRing } from 'lucide-react';
import type { PermitDashboard } from '@/services/ptw.service';
import { toneClass, formatDateTime } from './dashboard-ui';

interface PTWAlertFeedProps {
  alerts?: PermitDashboard['alerts'];
}

export function PTWAlertFeed({ alerts }: PTWAlertFeedProps) {
  const rows = alerts ?? [];

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-800/80 bg-[#070f1e] p-5 shadow-2xl select-none">
      
      {/* Header Container */}
      <div className="mb-4 flex items-center gap-2">
        <BellRing size={16} className="text-blue-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Alert Feed
        </h3>
      </div>

      {/* Scrollable Feed Container Container */}
      <div 
        className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
        style={{ maxHeight: '330px' }} // Strictly locks height to gracefully contain up to 4 elements flawlessly
      >
        {rows.map((alert) => {
          const badgeTone = toneClass(alert.severity);
          const isCritical = alert.severity === 'Critical' || alert.severity === 'High';
          const isWarning = alert.severity === 'Warning';

          return (
            <Link 
              key={alert.id} 
              href={alert.href} 
              className="block rounded-lg border border-slate-800/60 bg-slate-900/10 p-3 text-xs transition-all hover:border-slate-700 hover:bg-slate-900/30"
            >
              <div className="flex items-start gap-2.5">
                {/* Dynamic Status Icon Matrix */}
                {isCritical ? (
                  <AlertTriangle size={14} className="mt-0.5 text-red-400 flex-shrink-0 animate-pulse" />
                ) : isWarning ? (
                  <Clock size={14} className="mt-0.5 text-amber-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" />
                )}

                {/* Main Content Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-200 tracking-wide truncate">
                      {alert.type}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider border uppercase flex-shrink-0 ${
                      badgeTone.includes('red') || badgeTone.includes('rose') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      badgeTone.includes('amber') || badgeTone.includes('yellow') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-slate-400 font-medium leading-relaxed break-words">
                    {alert.message}
                  </p>
                  
                  <div className="mt-1.5 text-[10px] text-slate-500 font-semibold tracking-wide flex items-center gap-1">
                    <span className="text-slate-400 font-mono bg-slate-900/60 border border-slate-800/40 px-1 rounded">
                      {alert.permitNumber}
                    </span>
                    <span>·</span>
                    <span>{formatDateTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Empty State Overlay */}
        {!rows.length && (
          <div className="py-8 text-center rounded-lg border border-dashed border-slate-800/60 bg-slate-950/10">
            <CheckCircle2 size={20} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium">All systems stable. No pending telemetry alerts.</p>
          </div>
        )}
      </div>

    </section>
  );
}