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
    <section className="w-full h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Header Container */}
      <div className="mb-2.5 flex items-center gap-1.5">
        <BellRing size={14} className="text-primary dark:text-sky-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Alert Feed
        </h3>
      </div>

      {/* Scrollable Feed Container */}
      <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar max-h-[200px]">
        {rows.map((alert) => {
          const badgeTone = toneClass(alert.severity);
          const isCritical = alert.severity === 'Critical' || alert.severity === 'High';
          const isWarning = alert.severity === 'Warning';

          return (
            <Link
              key={alert.id}
              href={alert.href}
              className="block rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/10 p-3 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900/30"
            >
              <div className="flex items-start gap-2.5">
                {/* Dynamic Status Icon Matrix */}
                {isCritical ? (
                  <AlertTriangle size={14} className="mt-0.5 text-red-500 dark:text-red-400 shrink-0 animate-pulse" />
                ) : isWarning ? (
                  <Clock size={14} className="mt-0.5 text-amber-500 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 size={14} className="mt-0.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                )}

                {/* Main Content Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-200 tracking-wide truncate">
                      {alert.type}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider border uppercase shrink-0 ${
                        badgeTone.includes('red') || badgeTone.includes('rose')
                          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
                          : badgeTone.includes('amber') || badgeTone.includes('yellow')
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium leading-relaxed break-words">
                    {alert.message}
                  </p>

                  <div className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide flex items-center gap-1">
                    <span className="text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/40 px-1 py-0.2 rounded">
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

        {!rows.length && (
          <div className="py-8 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/10">
            <CheckCircle2 size={20} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium">All systems stable. No pending telemetry alerts.</p>
          </div>
        )}
      </div>
    </section>
  );
}
