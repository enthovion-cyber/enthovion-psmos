'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../moc-detail-ui';

const DEFAULT_MOCK_DATA = {
  overdueCount: 1,
  items: [
    { id: 'aq1', mocId: 'm1', mocNumber: 'MOC-2026-044', stepName: 'Technical Review', isOverdue: true, approverName: 'H. Bowman', dueAt: '2026-07-02' },
    { id: 'aq2', mocId: 'm2', mocNumber: 'MOC-2026-092', stepName: 'Operations Sign-off', isOverdue: false, approverName: 'A. Patel', dueAt: '2026-07-06' },
    { id: 'aq3', mocId: 'm3', mocNumber: 'MOC-2026-105', stepName: 'EHS Validation', isOverdue: false, approverName: 'S. Vance', dueAt: '2026-07-08' },
    { id: 'aq4', mocId: 'm4', mocNumber: 'MOC-2026-114', stepName: 'Pre-Commissioning Checklist', isOverdue: false, approverName: 'M. Ross', dueAt: '2026-07-12' },
    { id: 'aq5', mocId: 'm5', mocNumber: 'MOC-2026-121', stepName: 'Final Closeout Approval', isOverdue: false, approverName: 'K. Choi', dueAt: '2026-07-19' }
  ]
};

interface MOCApprovalQueuePanelProps {
  data?: Record<string, any> | undefined;
}

export function MOCApprovalQueuePanel({ data = {} }: MOCApprovalQueuePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const items = data.items ?? data.queue ?? (data.overdue === undefined && data.overdueCount === undefined ? DEFAULT_MOCK_DATA.items : []);
  const overdue = Number(data.overdue ?? data.overdueCount ?? (data.items === undefined ? DEFAULT_MOCK_DATA.overdueCount : 0));

  const displayedItems = isExpanded ? items : items.slice(0, 4);
  const hasMoreThanFour = items.length > 4;

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full overflow-hidden transition-colors text-[var(--psm-fg)]">
      {/* Header Block Frame */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            Workflow Approval Queue
          </h3>
        </div>
        <Badge tone={overdue ? 'red' : 'green'}>
          {overdue ? `${overdue} overdue` : 'On track'}
        </Badge>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-2.5 w-full">
        {displayedItems.length > 0 ? (
          displayedItems.map((item: any) => (
            <Link
              key={item.id}
              href={`/moc/${item.mocId ?? item.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 hover:border-primary/50 transition-colors text-xs"
            >
              <div className="min-w-0">
                <p className="font-mono font-bold text-primary truncate">
                  {item.mocNumber ?? item.moc_number ?? 'MOC'}
                </p>
                <p className="text-[11px] text-[var(--psm-muted)] truncate">
                  {item.stepName ?? item.step_name ?? 'Review'} · Approver: <strong className="text-[var(--psm-fg)]">{item.approverName ?? item.approver ?? '-'}</strong>
                </p>
              </div>
              <Badge tone={item.isOverdue ? 'red' : 'blue'}>
                {item.isOverdue ? 'Overdue' : 'Pending'}
              </Badge>
            </Link>
          ))
        ) : (
          <p className="py-6 text-center text-xs text-[var(--psm-muted)]">No pending approvals in queue.</p>
        )}
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
            <span>{isExpanded ? 'Show Less' : `Show All (${items.length})`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
