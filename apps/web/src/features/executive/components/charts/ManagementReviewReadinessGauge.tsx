'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  readinessStatus?: string | undefined;
  blockerCount?: number | undefined;
  warningCount?: number | undefined;
  blockers?: string[] | undefined;
  warnings?: string[] | undefined;
  score?: number | undefined;
  status?: string | undefined;
  blockersCount?: number | undefined;
  warningsCount?: number | undefined;
}

export function ManagementReviewReadinessGauge({
  readinessStatus = 'Ready',
  blockerCount = 0,
  warningCount = 0,
  blockers = [],
  warnings = [],
}: Props) {
  const isReady = /ready$/i.test(readinessStatus);
  const hasWarnings = /warning/i.test(readinessStatus) || warningCount > 0;
  const isBlocked = blockerCount > 0 || /not ready|missing|conflict/i.test(readinessStatus);

  const score = isBlocked
    ? Math.max(20, 100 - blockerCount * 30 - warningCount * 10)
    : hasWarnings
    ? Math.max(70, 100 - warningCount * 10)
    : 100;

  // Gauge SVG parameters
  const radius = 54;
  const circumference = Math.PI * radius; // Half circle (180 deg)
  const offset = circumference - (score / 100) * circumference;

  const color = isBlocked ? '#ef4444' : hasWarnings ? '#f59e0b' : '#10b981';

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md p-1.5 ${
              isBlocked
                ? 'bg-rose-500/10 text-rose-500'
                : hasWarnings
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500'
            }`}
          >
            {isBlocked ? (
              <AlertCircle size={16} />
            ) : hasWarnings ? (
              <AlertTriangle size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
          </span>
          <h3 className="text-base font-bold text-[var(--psm-text)]">
            Management Review Readiness Gauge
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
            isBlocked
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : hasWarnings
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}
        >
          {readinessStatus}
        </span>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 items-center">
        {/* Left: Half-Gauge Meter */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-28 w-48 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 120 70" className="w-full h-full">
              {/* Background Arc */}
              <path
                d="M 10 65 A 50 50 0 0 1 110 65"
                fill="none"
                className="stroke-[var(--psm-surface-2)]"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Progress Arc */}
              <path
                d="M 10 65 A 50 50 0 0 1 110 65"
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center text-center">
              <span className="text-2xl font-black text-[var(--psm-text)]">{score}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                Preparedness
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-[var(--psm-muted)]">
            Validates quorum, KPI snapshots, critical risks, and minutes templates.
          </p>
        </div>

        {/* Right: Validation Breakdown */}
        <div className="space-y-2.5 border-t border-[var(--psm-line)] pt-3 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] p-2">
            <span className="flex items-center gap-1.5 font-medium text-[var(--psm-text)]">
              <AlertCircle size={14} className="text-rose-500" /> Blockers
            </span>
            <span className={`font-bold ${blockerCount > 0 ? 'text-rose-500' : 'text-[var(--psm-text)]'}`}>
              {blockerCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] p-2">
            <span className="flex items-center gap-1.5 font-medium text-[var(--psm-text)]">
              <AlertTriangle size={14} className="text-amber-500" /> Warnings
            </span>
            <span className={`font-bold ${warningCount > 0 ? 'text-amber-500' : 'text-[var(--psm-text)]'}`}>
              {warningCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] p-2">
            <span className="flex items-center gap-1.5 font-medium text-[var(--psm-text)]">
              <CheckCircle2 size={14} className="text-emerald-500" /> Prerequisites Satisfied
            </span>
            <span className="font-bold text-emerald-500">
              {Math.max(0, 10 - blockerCount - warningCount)}/10
            </span>
          </div>

          {blockers.length > 0 && (
            <p className="text-[11px] text-rose-500 font-medium truncate" title={blockers[0]}>
              • {blockers[0]}
            </p>
          )}
          {warnings.length > 0 && (
            <p className="text-[11px] text-amber-500 font-medium truncate" title={warnings[0]}>
              • {warnings[0]}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
