'use client';

import React from 'react';
import Link from 'next/link';
import { History, FileText, CheckCircle2, AlertTriangle, User } from 'lucide-react';

const StatusBadge = ({ type }: { type: string }) => {
  let styles = 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  if (type === 'create') styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (type === 'approve') styles = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
  if (type === 'reject') styles = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  
  const label = type === 'create' ? 'Created' : type === 'approve' ? 'Approved' : type === 'reject' ? 'Rejected' : 'Updated';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${styles}`}>
      {label}
    </span>
  );
};

const DEFAULT_MOCK_DATA = [
  { id: 'act-1', type: 'create', mocNumber: 'MOC-2026-142', details: 'Initial process layout design submittal', user: 'E. Chevalier', timestamp: '10m ago' },
  { id: 'act-2', type: 'approve', mocNumber: 'MOC-2026-089', details: 'PSSR checklist verification sign-off', user: 'M. Tanaka', timestamp: '1h ago' },
  { id: 'act-3', type: 'reject', mocNumber: 'MOC-2026-112', details: 'Bypass valve modification documentation missing', user: 'A. Vance', timestamp: '3h ago' },
  { id: 'act-4', type: 'update', mocNumber: 'MOC-2026-034', details: 'Emergency procedure text update revision v2', user: 'J. Doe', timestamp: '5h ago' },
  { id: 'act-5', type: 'approve', mocNumber: 'MOC-2026-021', details: 'Mechanical integrity review approved', user: 'S. Patel', timestamp: '1d ago' }
];

interface MOCRecentActivityPanelProps {
  data?: Record<string, any> | any[] | undefined;
  items?: Record<string, any>[] | any[] | undefined;
}

export function MOCRecentActivityFeed({ data, items: propsItems }: MOCRecentActivityPanelProps) {
  const rawItems = propsItems ?? (Array.isArray(data) ? data : (data?.items ?? data?.activities ?? DEFAULT_MOCK_DATA));
  const items = Array.isArray(rawItems) ? rawItems : DEFAULT_MOCK_DATA;
  const displayedItems = items.slice(0, 4);

  return (
    <div className="w-full h-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-start text-[var(--psm-fg)]">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-2 shrink-0">
        <h3 className="text-base font-bold tracking-tight text-[var(--psm-fg)]">
          Recent Activity
        </h3>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)] border border-[var(--psm-line)] uppercase tracking-wider">
          Audit Trail Log
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {displayedItems.length ? (
          displayedItems.map((item: any) => {
            const ActionIcon = item.type === 'create' ? FileText : item.type === 'approve' ? CheckCircle2 : AlertTriangle;
            const iconColor = item.type === 'create' ? 'text-emerald-500' : item.type === 'approve' ? 'text-sky-500' : 'text-amber-500';

            return (
              <div 
                key={item.id} 
                className="flex items-start gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 transition-all hover:border-primary/50"
              >
                <div className={`mt-0.5 rounded-lg bg-[var(--psm-surface)] p-1.5 border border-[var(--psm-line)] ${iconColor} shrink-0`}>
                  <ActionIcon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-[var(--psm-fg)] truncate hover:text-primary transition-colors">
                      {item.mocNumber ?? item.moc_number}
                    </span>
                    <StatusBadge type={item.type} />
                  </div>
                  
                  <p className="text-xs text-[var(--psm-muted)] font-medium line-clamp-1 mb-1.5">
                    {item.details ?? item.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-medium text-[var(--psm-muted)]">
                    <span className="flex items-center gap-1">
                      <User size={10} className="text-[var(--psm-muted)]" /> {item.user ?? item.operator}
                    </span>
                    <span className="text-[var(--psm-muted)] font-normal">
                      {item.timestamp ?? item.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center w-full">
            <p className="text-xs font-medium text-[var(--psm-muted)]">No recent entries recorded</p>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-[var(--psm-line)] shrink-0">
          <Link
            href="/moc/history"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] py-2 text-xs font-bold text-[var(--psm-muted)] hover:text-[var(--psm-fg)] hover:border-primary/50 transition-all focus:outline-none"
          >
            <History size={13} className="text-[var(--psm-muted)]" />
            <span>View Full History Ledger</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
