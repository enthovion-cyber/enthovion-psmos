'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import type { ExecutiveDashboard, ExecutiveStatus } from '../../types/executive-kpi.types';

interface Props {
  header: ExecutiveDashboard['header'];
  moduleHealth?: ExecutiveDashboard['moduleHealth'];
}

export function ExecutiveHealthRadarInfographic({ header, moduleHealth = [] }: Props) {
  const rawScore = typeof header.score === 'number' ? header.score : 0;
  const hasScore = typeof header.score === 'number';

  // SVG Gauge calculations (circumference for radius 58)
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasScore
    ? circumference - (Math.min(Math.max(rawScore, 0), 100) / 100) * circumference
    : circumference;

  // Status color mapping
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981'; // Emerald
    if (score >= 70) return '#3b82f6'; // Blue
    if (score >= 55) return '#f59e0b'; // Amber
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const scoreColor = hasScore ? getScoreColor(rawScore) : '#64748b';

  // Module health counts
  const healthyCount = moduleHealth.filter(m => m.healthStatus === 'Healthy' || m.healthStatus === 'Good').length;
  const monitorCount = moduleHealth.filter(m => m.healthStatus === 'Monitor' || m.healthStatus === 'Warning').length;
  const criticalCount = moduleHealth.filter(m => m.healthStatus === 'Critical' || m.healthStatus === 'High Risk').length;
  const totalCount = moduleHealth.length || 14;

  const healthyPct = Math.round((healthyCount / totalCount) * 100);
  const monitorPct = Math.round((monitorCount / totalCount) * 100);
  const criticalPct = Math.round((criticalCount / totalCount) * 100);

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left: Overall Health Gauge Infographic */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex h-36 w-36 items-center justify-center shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 140 140">
              {/* Background track */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                className="stroke-[var(--psm-surface-2)]"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress arc */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke={scoreColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold tracking-tight text-[var(--psm-text)]">
                {hasScore ? rawScore : '—'}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                {hasScore ? '/ 100 Health' : 'Unavailable'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--psm-text)]">
              {rawScore >= 80 ? (
                <ShieldCheck size={14} className="text-emerald-500" />
              ) : (
                <ShieldAlert size={14} className="text-amber-500" />
              )}
              {header.status ?? 'Computed Foundation'}
            </div>
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Overall PSM Health Index</h3>
            <p className="max-w-xs text-xs text-[var(--psm-muted)] leading-relaxed">
              Composite score aggregated across active PSM barriers and 14 operational module adapters.
            </p>
          </div>
        </div>

        {/* Middle: Module Distribution Infographic */}
        <div className="flex-1 max-w-md space-y-3 border-y border-[var(--psm-line)] py-4 lg:border-y-0 lg:border-x lg:px-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[var(--psm-text)]">
              <Layers size={14} className="text-[var(--psm-primary)]" />
              Module Barrier Coverage
            </span>
            <span className="text-[var(--psm-muted)]">{moduleHealth.length} Connected Modules</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)] flex">
            <div
              style={{ width: `${healthyPct}%` }}
              title={`Healthy: ${healthyCount} modules (${healthyPct}%)`}
              className="bg-emerald-500 transition-all duration-500"
            />
            <div
              style={{ width: `${monitorPct}%` }}
              title={`Monitor: ${monitorCount} modules (${monitorPct}%)`}
              className="bg-amber-500 transition-all duration-500"
            />
            <div
              style={{ width: `${criticalPct}%` }}
              title={`High Risk / Critical: ${criticalCount} modules (${criticalPct}%)`}
              className="bg-rose-500 transition-all duration-500"
            />
          </div>

          {/* Breakdown pills */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{healthyCount}</p>
              <p className="text-[10px] text-[var(--psm-muted)]">Healthy</p>
            </div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2">
              <p className="font-bold text-amber-600 dark:text-amber-400">{monitorCount}</p>
              <p className="text-[10px] text-[var(--psm-muted)]">Monitor</p>
            </div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2">
              <p className="font-bold text-rose-600 dark:text-rose-400">{criticalCount}</p>
              <p className="text-[10px] text-[var(--psm-muted)]">Critical</p>
            </div>
          </div>
        </div>

        {/* Right: Operational Penalty & Degradation Factors */}
        <div className="space-y-2 shrink-0 lg:w-64">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            Active Risk Deductions
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2">
              <span className="flex items-center gap-1.5 text-[var(--psm-text)]">
                <AlertTriangle size={13} className="text-rose-500" />
                Critical Alerts
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {header.criticalAlertsCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2">
              <span className="flex items-center gap-1.5 text-[var(--psm-text)]">
                <Clock size={13} className="text-amber-500" />
                Overdue Actions
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {header.overdueActionCount ?? 0}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
