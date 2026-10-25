'use client';

import React from 'react';
import { Clock3 } from 'lucide-react';
import { Badge } from '../moc-detail-ui';

const DEFAULT_MOCK_DATA = {
  pendingUnder3Days: 4,
  pending3To7Days: 2,
  pendingOver7Days: 1,
  overdueApprovals: 3
};

interface MOCApprovalAgingProps {
  data?: Record<string, any> | undefined;
}

export function MOCApprovalAging({ data = {} }: MOCApprovalAgingProps) {
  const hasData = Object.keys(data).length > 0;
  const activeData: Record<string, any> = hasData ? data : DEFAULT_MOCK_DATA;

  const buckets = [
    ['Pending <3 days', activeData.pendingUnder3Days ?? activeData.under3 ?? 0, 'green'],
    ['Pending 3-7 days', activeData.pending3To7Days ?? activeData.between3And7 ?? 0, 'amber'],
    ['Pending >7 days', activeData.pendingOver7Days ?? activeData.over7 ?? 0, 'red'],
    ['Overdue Approvals', activeData.overdueApprovals ?? activeData.overdue ?? 0, 'red']
  ] as const;

  return (
    <div className="w-full h-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-start transition-colors text-[var(--psm-fg)]">
      {/* Header Block Frame */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            Approval Aging Analytics
          </h3>
        </div>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)] border border-[var(--psm-line)] uppercase tracking-wider">
          Workflow Engine
        </span>
      </div>

      {/* Grid Layout Canvas */}
      <div className="grid gap-2.5 grid-cols-2">
        {buckets.map(([label, count, tone]) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)] truncate">
              {label}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-[var(--psm-fg)]">{count}</span>
              <Badge tone={tone as any}>{tone === 'red' ? 'Critical' : tone === 'amber' ? 'Warning' : 'OK'}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
