'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { FileText, ShieldAlert } from 'lucide-react';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementEvidenceTab({ detail }: Props) {
  const missingCount = detail.score.missing_evidence_count;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--psm-text)]">Evidence Readiness & Verification</h3>
            <p className="text-xs text-[var(--psm-muted)]">Documented proof required to substantiate this element&apos;s health score.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--psm-muted)]">Missing Evidence Items</span>
            <div className={`mt-2 text-3xl font-black ${missingCount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
              {missingCount}
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              {missingCount > 0 ? 'Deficiencies penalize element score.' : 'All mandatory evidence verified.'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--psm-muted)]">Data Quality Readiness</span>
            <div className="mt-2 text-3xl font-black text-[var(--psm-text)]">
              {detail.score.data_quality_status}
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">Based on freshness and verification timestamps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
