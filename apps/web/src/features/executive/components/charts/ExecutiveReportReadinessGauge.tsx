'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export function ExecutiveReportReadinessGauge({
  readinessRate = 94,
  verifiedSourceCount = 18,
  warningCount = 1,
  missingCount = 0,
}: {
  readinessRate?: number | undefined;
  verifiedSourceCount?: number | undefined;
  warningCount?: number | undefined;
  missingCount?: number | undefined;
}) {
  const radius = 64;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (readinessRate / 100) * circumference;

  const color =
    readinessRate >= 90
      ? 'var(--psm-primary, #0284c7)'
      : readinessRate >= 75
      ? '#f59e0b'
      : '#f43f5e';

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--psm-primary)]" />
          <h3 className="text-sm font-bold text-[var(--psm-text)]">Report Package Readiness</h3>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
          Auditable Lineage
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center justify-center">
        <svg width={160} height={96} className="overflow-visible">
          {/* Background track */}
          <path
            d="M 16 88 A 64 64 0 0 1 144 88"
            fill="none"
            stroke="var(--psm-line)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active progress */}
          <path
            d="M 16 88 A 64 64 0 0 1 144 88"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="-mt-8 text-center">
          <span className="text-2xl font-black text-[var(--psm-text)]">{readinessRate}%</span>
          <p className="text-[11px] font-medium text-[var(--psm-muted)]">Readiness Score</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--psm-line)] pt-3 text-center text-xs">
        <div>
          <span className="font-bold text-emerald-500">{verifiedSourceCount}</span>
          <p className="text-[10px] text-[var(--psm-muted)]">Verified</p>
        </div>
        <div>
          <span className="font-bold text-amber-500">{warningCount}</span>
          <p className="text-[10px] text-[var(--psm-muted)]">Warnings</p>
        </div>
        <div>
          <span className="font-bold text-rose-500">{missingCount}</span>
          <p className="text-[10px] text-[var(--psm-muted)]">Missing</p>
        </div>
      </div>
    </div>
  );
}
