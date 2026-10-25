'use client';

import React from 'react';
import { AlertCircle, Clock, PieChart, ShieldAlert } from 'lucide-react';

export type GenericAlertItem = {
  severity?: string | null;
  dueDate?: string | null;
  due_date?: string | null;
  title?: string;
  alert_title?: string;
  age_days?: number | null;
};

interface Props {
  alerts: GenericAlertItem[];
}

export function ExecutiveAlertDonutChart({ alerts }: Props) {
  // Severity counts
  const critical = alerts.filter(a => a.severity?.toLowerCase() === 'critical').length;
  const high = alerts.filter(a => a.severity?.toLowerCase() === 'high').length;
  const medium = alerts.filter(a => a.severity?.toLowerCase() === 'medium').length;
  const low = alerts.filter(a => a.severity?.toLowerCase() === 'low').length;
  const total = alerts.length;

  const getAgeDays = (a: GenericAlertItem) => {
    if (typeof a.age_days === 'number') return a.age_days;
    const dateStr = a.due_date ?? a.dueDate;
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Aging counts
  const fresh = alerts.filter(a => getAgeDays(a) < 7).length;
  const week1 = alerts.filter(a => getAgeDays(a) >= 7 && getAgeDays(a) < 14).length;
  const week2 = alerts.filter(a => getAgeDays(a) >= 14 && getAgeDays(a) < 30).length;
  const stale = alerts.filter(a => getAgeDays(a) >= 30).length;

  // Donut SVG parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  // Arc calculations
  const criticalOffset = total ? (critical / total) * circumference : 0;
  const highOffset = total ? (high / total) * circumference : 0;
  const mediumOffset = total ? (medium / total) * circumference : 0;
  const lowOffset = total ? (low / total) * circumference : 0;

  let accumulated = 0;
  const strokeSegments = [
    { count: critical, color: '#ef4444', label: 'Critical' },
    { count: high, color: '#f97316', label: 'High' },
    { count: medium, color: '#f59e0b', label: 'Medium' },
    { count: low, color: '#3b82f6', label: 'Low' },
  ].map(seg => {
    const dashLength = total ? (seg.count / total) * circumference : 0;
    const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
    const strokeDashoffset = -accumulated;
    accumulated += dashLength;
    return { ...seg, strokeDasharray, strokeDashoffset };
  });

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-rose-500/10 p-1.5 text-rose-500">
            <PieChart size={16} />
          </span>
          <h3 className="text-base font-bold text-[var(--psm-text)]">
            Alert Severity &amp; Aging Infographic
          </h3>
        </div>
        <span className="text-xs font-semibold text-[var(--psm-muted)]">
          {total} Active Items
        </span>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 items-center">
        {/* Left: Donut Chart */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-32 w-32 items-center justify-center shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-[var(--psm-surface-2)]"
                strokeWidth="14"
                fill="transparent"
              />
              {total > 0 ? (
                strokeSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    fill="transparent"
                    style={{ transition: 'all 0.6s ease' }}
                  />
                ))
              ) : null}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-[var(--psm-text)]">{total}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                Alerts
              </span>
            </div>
          </div>

          {/* Severity Legend */}
          <div className="space-y-1.5 text-xs">
            {strokeSegments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-[var(--psm-text)] font-medium">{seg.label}:</span>
                <span className="font-bold text-[var(--psm-text)]">{seg.count}</span>
                <span className="text-[10px] text-[var(--psm-muted)]">
                  ({total ? Math.round((seg.count / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Aging Breakdown Histogram */}
        <div className="space-y-2 border-t border-[var(--psm-line)] pt-4 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-text)]">
            <Clock size={13} className="text-amber-500" />
            <span>Aging &amp; Velocity Distribution</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--psm-muted)]">&lt; 7 Days (Fresh)</span>
                <span className="font-semibold text-[var(--psm-text)]">{fresh}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                <div style={{ width: `${total ? (fresh / total) * 100 : 0}%` }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--psm-muted)]">7–14 Days</span>
                <span className="font-semibold text-[var(--psm-text)]">{week1}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                <div style={{ width: `${total ? (week1 / total) * 100 : 0}%` }} className="h-full bg-blue-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--psm-muted)]">15–30 Days</span>
                <span className="font-semibold text-[var(--psm-text)]">{week2}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                <div style={{ width: `${total ? (week2 / total) * 100 : 0}%` }} className="h-full bg-amber-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--psm-muted)]">&gt; 30 Days (Stale / Overdue)</span>
                <span className="font-semibold text-rose-500">{stale}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                <div style={{ width: `${total ? (stale / total) * 100 : 0}%` }} className="h-full bg-rose-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
