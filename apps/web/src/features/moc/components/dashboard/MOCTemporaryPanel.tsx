'use client';

import React from 'react';
import Link from 'next/link';
import { Badge, ProgressBar } from '../moc-detail-ui';

const DEFAULT_MOCK_DATA = {
  summary: {
    active: 14,
    overdue: 2,
    expiringWithin30: 5,
    expiringWithin7: 1
  },
  items: [
    { id: 't1', mocNumber: 'MOC-2026-044', title: 'Temporary Nitrogen Purge Bypass Line', daysRemaining: -4, owner: 'J. Mitchell', expiryDate: '2026-06-30', normalizationRisk: true },
    { id: 't2', mocNumber: 'MOC-2026-092', title: 'Temporary Distillation Column Transmitter Swap', daysRemaining: 5, owner: 'A. Patel', expiryDate: '2026-07-09', normalizationRisk: false },
    { id: 't3', mocNumber: 'MOC-2026-105', title: 'Temporary Catalyst Feed Hose Connection', daysRemaining: 18, owner: 'S. Vance', expiryDate: '2026-07-22', normalizationRisk: false }
  ]
};

interface MOCTemporaryPanelProps {
  data?: Record<string, any> | undefined;
}

export function MOCTemporaryPanel({ data = {} }: MOCTemporaryPanelProps) {
  const items = data.items ?? data.expiring ?? (data.summary === undefined ? DEFAULT_MOCK_DATA.items : []);
  const summary = data.summary ?? (data.active !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  
  const active = Number(summary.active ?? summary.activeCount ?? 0);
  const overdue = Number(summary.overdue ?? summary.overdueCount ?? 0);
  const expiring = Number(summary.expiringWithin30 ?? summary.expiringSoon ?? summary.expiringSoonCount ?? 0);

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col h-full overflow-hidden transition-colors text-[var(--psm-fg)]">
      {/* Component Header Block */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            Temporary Change Control
          </h3>
        </div>
        <Badge tone={overdue ? 'red' : 'green'}>
          {overdue ? `${overdue} overdue` : 'Controlled'}
        </Badge>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4 w-full flex-1 justify-start overflow-hidden">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0">
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-[var(--psm-muted)] uppercase tracking-wider">Active</p>
            <p className="text-xl font-black font-mono text-[var(--psm-fg)] mt-1">{active}</p>
          </div>
          
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Expiring 30d</p>
              <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{expiring}</p>
            </div>
            <p className="text-[9px] font-medium text-[var(--psm-muted)] mt-1 border-t border-[var(--psm-line)] pt-1">
              7d critical: {summary.expiringWithin7 ?? 0}
            </p>
          </div>
          
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">{overdue}</p>
          </div>
        </div>

        {/* Temporary items list */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {items.length ? (
            items.slice(0, 4).map((item: any) => {
              const days = Number(item.days_remaining ?? item.daysRemaining ?? 0);
              const tone = days < 0 ? 'red' : days <= 7 ? 'amber' : 'green';

              return (
                <Link
                  key={item.id ?? item.moc_id}
                  href={item.href ?? `/moc/${item.moc_id ?? item.mocId ?? item.id}`}
                  className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="font-bold text-xs text-[var(--psm-fg)] truncate max-w-[70%]">
                      <span className="font-mono text-primary mr-1">{item.mocNumber ?? item.moc_number}</span> · {item.title}
                    </p>
                    <Badge tone={tone}>
                      {days < 0 ? `${Math.abs(days)}d Overdue` : `${days}d Left`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--psm-muted)]">
                    <span>Owner: {item.owner ?? '-'}</span>
                    <span className="font-mono">{item.expiryDate ?? item.temporaryExpiryDate ?? '-'}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="py-6 text-center text-xs text-[var(--psm-muted)]">No active temporary changes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
