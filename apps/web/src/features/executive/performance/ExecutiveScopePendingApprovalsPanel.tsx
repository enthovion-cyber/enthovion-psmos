'use client';

import React from 'react';
import { CheckSquare, ArrowUpRight } from 'lucide-react';

interface Props {
  approvals: any[];
}

export function ExecutiveScopePendingApprovalsPanel({ approvals = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--psm-line)] pb-3">
        <CheckSquare className="h-5 w-5 text-blue-500" />
        <h3 className="font-bold text-[var(--psm-text)]">Pending Management Reviews & Approvals</h3>
        <span className="ml-auto rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400">
          {approvals.length} Pending
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {approvals.map((approval, index) => (
          <div
            key={approval.id ?? index}
            className="flex items-start gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 transition"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-[var(--psm-text)] truncate">{approval.title ?? 'Approval Request'}</h4>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {approval.stage ?? 'Review'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{approval.description ?? 'Awaiting management sign-off.'}</p>
              {approval.reviewer ? (
                <span className="mt-2 inline-block text-[11px] text-[var(--psm-muted)]">
                  Assigned Reviewer: {approval.reviewer}
                </span>
              ) : null}
            </div>
          </div>
        ))}

        {!approvals.length ? (
          <p className="py-6 text-center text-sm text-[var(--psm-muted)]">
            No pending approvals awaiting sign-off in this scope.
          </p>
        ) : null}
      </div>
    </div>
  );
}
