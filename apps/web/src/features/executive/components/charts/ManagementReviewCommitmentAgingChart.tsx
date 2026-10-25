'use client';

import React from 'react';
import { Clock, CheckSquare, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  totalCommitments?: number | undefined;
  openCommitments?: number | undefined;
  overdueCommitments?: number | undefined;
  pendingVerificationCount?: number | undefined;
  aging?: {
    under7Days?: number | undefined;
    sevenTo14Days?: number | undefined;
    fifteenTo30Days?: number | undefined;
    over30Days?: number | undefined;
  } | undefined;
}

export function ManagementReviewCommitmentAgingChart({
  totalCommitments = 0,
  openCommitments = 0,
  overdueCommitments = 0,
  pendingVerificationCount = 0,
  aging = { under7Days: 0, sevenTo14Days: 0, fifteenTo30Days: 0, over30Days: 0 },
}: Props) {
  const u7 = aging.under7Days ?? 0;
  const w14 = aging.sevenTo14Days ?? 0;
  const w30 = aging.fifteenTo30Days ?? 0;
  const o30 = aging.over30Days ?? 0;

  const maxVal = Math.max(1, u7, w14, w30, o30, overdueCommitments);

  const getWidth = (val: number) => `${Math.round((val / maxVal) * 100)}%`;

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-500/10 p-1.5 text-amber-500">
            <Clock size={16} />
          </span>
          <h3 className="text-base font-bold text-[var(--psm-text)]">
            Management Commitment Aging &amp; Follow-Up
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--psm-muted)]">
          <span>{openCommitments} Active</span>
          <span>·</span>
          <span className="text-rose-500 font-bold">{overdueCommitments} Overdue</span>
          <span>·</span>
          <span className="text-sky-500">{pendingVerificationCount} Awaiting Verification</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* Bracket 1: < 7 Days */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-[var(--psm-muted)]">&lt; 7 Days Overdue (Grace Period)</span>
            <span className="font-bold text-[var(--psm-text)]">{u7}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
            <div
              style={{ width: getWidth(u7) }}
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* Bracket 2: 7-14 Days */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-[var(--psm-muted)]">7–14 Days Overdue (Escalation Warning)</span>
            <span className="font-bold text-blue-500">{w14}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
            <div
              style={{ width: getWidth(w14) }}
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* Bracket 3: 15-30 Days */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-[var(--psm-muted)]">15–30 Days Overdue (Level 2 Escalation)</span>
            <span className="font-bold text-amber-500">{w30}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
            <div
              style={{ width: getWidth(w30) }}
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* Bracket 4: > 30 Days */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-[var(--psm-muted)]">&gt; 30 Days Overdue (Corporate Attention)</span>
            <span className="font-bold text-rose-500">{o30}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
            <div
              style={{ width: getWidth(o30) }}
              className="h-full rounded-full bg-rose-500 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--psm-line)] pt-3 text-xs text-[var(--psm-muted)]">
        <span>Follow-up obligations synchronized with Universal Action Engine</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {totalCommitments > 0
            ? `${Math.round(((totalCommitments - overdueCommitments) / totalCommitments) * 100)}% On-Track`
            : '100% On-Track'}
        </span>
      </div>
    </section>
  );
}
