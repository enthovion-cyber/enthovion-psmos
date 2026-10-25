'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface Props {
  observedPeriods?: number;
  totalPeriods?: number;
  qualityStatus?: string;
  staleCount?: number;
}

export function ExecutiveTrendQualityGauge({
  observedPeriods = 0,
  totalPeriods = 1,
  qualityStatus = 'Observed Historical Data',
  staleCount = 0,
}: Props) {
  const ratio = totalPeriods > 0 ? Math.min(1, observedPeriods / totalPeriods) : 0;
  const percentage = Math.round(ratio * 100);

  const radius = 54;
  const circumference = Math.PI * radius; // 180 degrees
  const offset = circumference - ratio * circumference;

  const isHigh = percentage >= 85 && staleCount === 0;
  const isModerate = percentage >= 50;
  const color = isHigh ? '#10b981' : isModerate ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 text-center shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {isHigh ? (
          <ShieldCheck className="text-emerald-500" size={18} />
        ) : isModerate ? (
          <AlertTriangle className="text-amber-500" size={18} />
        ) : (
          <AlertCircle className="text-rose-500" size={18} />
        )}
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
          Historical Data Integrity &amp; Coverage
        </h4>
      </div>

      <div className="relative mt-2 flex items-center justify-center">
        <svg width="150" height="90" viewBox="0 0 150 90" className="overflow-visible">
          {/* Background track */}
          <path
            d="M 15 80 A 54 54 0 0 1 135 80"
            fill="none"
            stroke="var(--psm-line)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 15 80 A 54 54 0 0 1 135 80"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="font-mono text-2xl font-black text-[var(--psm-text)]">
            {percentage}%
          </span>
          <span className="text-[10px] text-[var(--psm-muted)] uppercase tracking-wider">
            Coverage
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs font-bold text-[var(--psm-text)]">{qualityStatus}</p>
        <p className="mt-0.5 text-[11px] text-[var(--psm-muted)]">
          {observedPeriods} of {totalPeriods} periods observed
          {staleCount > 0 ? ` · ${staleCount} stale runs` : ''}
        </p>
      </div>
    </div>
  );
}
