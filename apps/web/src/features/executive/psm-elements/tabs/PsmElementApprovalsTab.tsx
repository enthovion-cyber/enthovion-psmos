'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { CheckSquare } from 'lucide-react';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementApprovalsTab({ detail }: Props) {
  const pendingCount = detail.score.pending_approval_count;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--psm-text)]">Review & Approval Stage</h3>
            <p className="text-xs text-[var(--psm-muted)]">Active governance workflows awaiting sign-off.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-6 text-center max-w-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--psm-muted)]">Pending Approvals</span>
          <div className={`mt-2 text-3xl font-black ${pendingCount > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
            {pendingCount}
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            {pendingCount > 0 ? 'Workflows pending management or SME review.' : 'Zero pending reviews in this element.'}
          </p>
        </div>
      </div>
    </div>
  );
}
