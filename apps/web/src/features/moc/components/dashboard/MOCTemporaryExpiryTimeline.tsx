'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../moc-detail-ui';

const DEFAULT_MOCK_DATA = [
  { id: '1', mocId: 'm1', mocNumber: 'MOC-2026-044', title: 'Temporary Nitrogen Purge Bypass Line', daysRemaining: -4, owner: 'J. Mitchell', expiryDate: '2026-06-30', riskLevel: 'Critical', normalizationRisk: true },
  { id: '2', mocId: 'm2', mocNumber: 'MOC-2026-092', title: 'Transmitter Swap Column 4', daysRemaining: 5, owner: 'A. Patel', expiryDate: '2026-07-09', riskLevel: 'High', normalizationRisk: false },
  { id: '3', mocId: 'm3', mocNumber: 'MOC-2026-105', title: 'Catalyst Feed Hose Bypass', daysRemaining: 18, owner: 'S. Vance', expiryDate: '2026-07-22', riskLevel: 'Medium', normalizationRisk: false },
  { id: '4', mocId: 'm4', mocNumber: 'MOC-2026-114', title: 'Auxiliary Cooling Fan Hookup', daysRemaining: 28, owner: 'M. Ross', expiryDate: '2026-08-01', riskLevel: 'Low', normalizationRisk: false },
  { id: '5', mocId: 'm5', mocNumber: 'MOC-2026-121', title: 'Flare Header Line Relocation', daysRemaining: 45, owner: 'K. Choi', expiryDate: '2026-08-18', riskLevel: 'High', normalizationRisk: true },
];

interface MOCTemporaryExpiryTimelineProps {
  items?: Array<Record<string, any>> | undefined;
}

export function MOCTemporaryExpiryTimeline({ items }: MOCTemporaryExpiryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const baseItems: Array<Record<string, any>> = items && items.length > 0 ? items : DEFAULT_MOCK_DATA;
  const sorted = [...baseItems].sort((a: any, b: any) => Number(a.daysRemaining ?? a.days_remaining ?? 9999) - Number(b.daysRemaining ?? b.days_remaining ?? 9999));
  
  const displayedItems = isExpanded ? sorted : sorted.slice(0, 4);
  const hasMoreThanFour = sorted.length > 4;

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full transition-colors text-[var(--psm-fg)]">
      {/* Header Frame */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[var(--psm-line)] pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            Temporary Change Expiry Timeline
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[var(--psm-muted)] uppercase tracking-wider">
          30d · 7d · Overdue Controls
        </span>
      </div>

      {/* Main Timeline Card List */}
      <div className="flex flex-col gap-2.5 w-full">
        {displayedItems.map((item: any) => {
          const days = Number(item.daysRemaining ?? item.days_remaining ?? 0);
          const isOverdue = days < 0;
          const tone = isOverdue ? 'red' : days <= 7 ? 'amber' : 'green';

          return (
            <Link
              key={item.id}
              href={`/moc/${item.mocId ?? item.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 hover:border-primary/50 transition-colors text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-primary truncate">
                    {item.mocNumber ?? item.moc_number}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="truncate font-semibold text-[var(--psm-fg)]">{item.title}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--psm-muted)]">
                  Owner: <strong className="text-[var(--psm-fg)]">{item.owner ?? '-'}</strong> · Target Expiry: {item.expiryDate ?? '-'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.normalizationRisk && <Badge tone="purple">Norm Risk</Badge>}
                <Badge tone={tone}>{isOverdue ? `${Math.abs(days)}d Overdue` : `${days}d Left`}</Badge>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Expand / Collapse Control */}
      {hasMoreThanFour && (
        <div className="mt-3 pt-2 border-t border-[var(--psm-line)]">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-bold text-primary hover:underline"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{isExpanded ? 'Show Less' : `Show All (${sorted.length})`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
