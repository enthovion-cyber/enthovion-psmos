'use client';

import React from 'react';
import Link from 'next/link';
import { Siren } from 'lucide-react';
import { Badge } from '../moc-detail-ui';

interface MOCCriticalRiskAlertProps {
  items?: Array<Record<string, any>>;
}

export function MOCCriticalRiskAlert({ items = [] }: MOCCriticalRiskAlertProps) {
  return (
    <div className="w-full h-auto rounded-xl border border-rose-500/30 bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-start transition-colors text-[var(--psm-fg)]">
      {/* Header Area Block */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Siren size={16} className={items.length ? 'text-rose-500 animate-pulse' : 'text-[var(--psm-muted)]'} />
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            Critical Risk Notifications
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
              className="block rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 hover:border-rose-500/40 transition-colors group focus:outline-none"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/10 pb-2 mb-2">
                <p className="font-bold text-xs text-[var(--psm-fg)] truncate">
                  <span className="font-mono text-rose-500 mr-1.5 font-bold">{item.mocNumber}</span>
                  <span className="opacity-40 mx-1">·</span>
                  <span>{item.title}</span>
                </p>
                <div className="flex justify-start">
                  <Badge tone="red">{item.currentWorkflowStep ?? 'Critical Review'}</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--psm-muted)]">
                <span>Unit: <strong className="text-[var(--psm-fg)]">{item.unitName ?? 'General'}</strong></span>
                <span>Open: <strong className="font-mono text-rose-500">{item.daysOpen ?? 0} days</strong></span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-[var(--psm-muted)]">
            No critical or high-exposure MOCs requiring immediate management intervention.
          </div>
        )}
      </div>
    </div>
  );
}
