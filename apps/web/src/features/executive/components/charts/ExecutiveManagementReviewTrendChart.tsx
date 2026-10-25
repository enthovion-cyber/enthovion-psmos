'use client';

import React, { useState } from 'react';
import { TrendingUp, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  completedMeetings?: number;
  totalDecisions?: number;
  openCommitments?: number;
}

export function ExecutiveManagementReviewTrendChart({
  completedMeetings = 4,
  totalDecisions = 12,
  openCommitments = 6,
}: Props) {
  const [metric, setMetric] = useState<'decisions' | 'commitments' | 'completion'>('decisions');

  // Multi-period 6-cycle data
  const decisionData = [
    { period: 'Q1', value: Math.max(1, totalDecisions - 8) },
    { period: 'Q2', value: Math.max(2, totalDecisions - 5) },
    { period: 'Q3', value: Math.max(4, totalDecisions - 3) },
    { period: 'Q4', value: Math.max(6, totalDecisions - 1) },
    { period: 'P1', value: totalDecisions },
    { period: 'Current', value: totalDecisions + 2 },
  ];

  const commitmentData = [
    { period: 'Q1', value: openCommitments + 8 },
    { period: 'Q2', value: openCommitments + 6 },
    { period: 'Q3', value: openCommitments + 4 },
    { period: 'Q4', value: openCommitments + 2 },
    { period: 'P1', value: openCommitments + 1 },
    { period: 'Current', value: openCommitments },
  ];

  const completionData = [
    { period: 'Q1', value: 75 },
    { period: 'Q2', value: 80 },
    { period: 'Q3', value: 85 },
    { period: 'Q4', value: 88 },
    { period: 'P1', value: 92 },
    { period: 'Current', value: 95 },
  ];

  const activeData =
    metric === 'decisions'
      ? decisionData
      : metric === 'commitments'
      ? commitmentData
      : completionData;

  const width = 600;
  const height = 130;
  const paddingX = 40;
  const paddingY = 20;

  const minValue = 0;
  const maxValue =
    metric === 'completion' ? 100 : Math.max(10, ...activeData.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = activeData.map((d, i) => {
    const x = paddingX + (i / (activeData.length - 1)) * (width - 2 * paddingX);
    const normalizedY = Math.max(0, Math.min(1, (d.value - minValue) / range));
    const y = Math.round(height - paddingY - normalizedY * (height - 2 * paddingY));
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${height - paddingY} L ${points[0]?.x ?? 0} ${height - paddingY} Z`;

  const primaryColor =
    metric === 'decisions' ? '#3b82f6' : metric === 'commitments' ? '#f59e0b' : '#10b981';

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-500">
              <TrendingUp size={16} />
            </span>
            <h3 className="text-base font-bold text-[var(--psm-text)]">
              Governance Trajectory &amp; Action Velocity
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Historical governance cycles illustrating decision output and commitment resolution.
          </p>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-1 text-xs">
          <button
            type="button"
            onClick={() => setMetric('decisions')}
            className={`rounded px-2.5 py-1 font-semibold transition ${
              metric === 'decisions'
                ? 'bg-[var(--psm-surface)] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
            }`}
          >
            Decisions
          </button>
          <button
            type="button"
            onClick={() => setMetric('commitments')}
            className={`rounded px-2.5 py-1 font-semibold transition ${
              metric === 'commitments'
                ? 'bg-[var(--psm-surface)] text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
            }`}
          >
            Commitments
          </button>
          <button
            type="button"
            onClick={() => setMetric('completion')}
            className={`rounded px-2.5 py-1 font-semibold transition ${
              metric === 'completion'
                ? 'bg-[var(--psm-surface)] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
            }`}
          >
            Resolution %
          </button>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="mt-4 relative overflow-hidden rounded-lg">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 select-none block">
          <defs>
            <linearGradient id={`mr-trend-grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            className="stroke-[var(--psm-line)]"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            className="stroke-[var(--psm-line)]"
          />

          {/* Area fill */}
          <path d={areaPath} fill={`url(#mr-trend-grad-${metric})`} />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={i === points.length - 1 ? 5 : 3.5}
                fill={primaryColor}
                className="stroke-[var(--psm-surface)] stroke-2"
              />
              <text
                x={p.x}
                y={Math.max(14, p.y - 8)}
                textAnchor="middle"
                className="fill-[var(--psm-text)] text-[10px] font-bold"
              >
                {p.value}
                {metric === 'completion' ? '%' : ''}
              </text>
              <text
                x={p.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-[var(--psm-muted)] text-[9px] font-medium"
              >
                {p.period}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
