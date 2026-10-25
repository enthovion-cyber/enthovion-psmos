'use client';

import React, { useState } from 'react';
import type { ExecutiveTrendPoint } from '../../types/executive-trend.types';

interface Props {
  points?: ExecutiveTrendPoint[];
  title?: string;
  metricLabel?: string;
  unit?: string;
  directionality?: 'Higher is better' | 'Lower is better' | 'Target range';
  height?: number;
}

export function ExecutiveTrendMultiLineChart({
  points = [],
  title = 'Historical Performance Trajectory',
  metricLabel = 'Performance Metric',
  unit = 'Value',
  directionality = 'Higher is better',
  height = 240,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
        <p className="text-sm font-semibold text-[var(--psm-text)]">No Historical Observations</p>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          No verified time-series data exists for this scope and period. Points are not fabricated from current state.
        </p>
      </div>
    );
  }

  const validValues = points.map((p) => p.metric_value).filter((v): v is number => typeof v === 'number');
  const minVal = validValues.length ? Math.min(...validValues) : 0;
  const maxVal = validValues.length ? Math.max(...validValues) : 100;
  const valRange = maxVal === minVal ? 1 : maxVal - minVal;

  const width = 680;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Build SVG path coordinates
  const coords = points.map((p, idx) => {
    const x = paddingX + (points.length > 1 ? (idx / (points.length - 1)) * chartW : chartW / 2);
    const y = p.metric_value !== null
      ? paddingY + chartH - ((p.metric_value - minVal) / valRange) * chartH
      : null;
    return { x, y, point: p };
  });

  // Create segments skipping null / missing values
  let pathD = '';
  coords.forEach((c, idx) => {
    if (c.y !== null) {
      if (!pathD || coords[idx - 1]?.y === null) {
        pathD += `M ${c.x} ${c.y} `;
      } else {
        pathD += `L ${c.x} ${c.y} `;
      }
    }
  });

  // Calculate overall trajectory trend direction
  const first = validValues[0];
  const last = validValues[validValues.length - 1];
  const delta = (first !== undefined && last !== undefined) ? last - first : 0;
  const isImproving = directionality === 'Higher is better' ? delta > 0 : delta < 0;
  const isWorsening = directionality === 'Higher is better' ? delta < 0 : delta > 0;

  const trendColor = isImproving ? '#10b981' : isWorsening ? '#ef4444' : '#3b82f6';

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-3">
        <div>
          <h3 className="text-base font-bold text-[var(--psm-text)]">{title}</h3>
          <p className="text-xs text-[var(--psm-muted)]">
            {points.length} observed periods · {unit} · Directionality: {directionality}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isImproving
                ? 'bg-emerald-500/10 text-emerald-500'
                : isWorsening
                ? 'bg-red-500/10 text-red-500'
                : 'bg-blue-500/10 text-blue-500'
            }`}
          >
            {isImproving ? '↑ Improving' : isWorsening ? '↓ Worsening' : '→ Stable'}
            {delta !== 0 && ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)})`}
          </span>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + chartH * pct;
            const val = maxVal - pct * valRange;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="var(--psm-line)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--psm-muted)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {pathD && (
            <path
              d={`${pathD} L ${coords.filter((c) => c.y !== null).at(-1)?.x ?? chartW} ${
                paddingY + chartH
              } L ${coords.find((c) => c.y !== null)?.x ?? paddingX} ${paddingY + chartH} Z`}
              fill="url(#trendGradient)"
            />
          )}

          {/* Main trend line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={trendColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {coords.map((c, idx) => {
            if (c.y === null) {
              // Missing period indicator
              return (
                <g key={idx}>
                  <line
                    x1={c.x}
                    y1={paddingY}
                    x2={c.x}
                    y2={paddingY + chartH}
                    stroke="var(--psm-line)"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={c.x}
                    cy={paddingY + chartH / 2}
                    r="4"
                    fill="var(--psm-surface)"
                    stroke="var(--psm-muted)"
                    strokeWidth="1.5"
                  />
                </g>
              );
            }

            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 6 : 4}
                  fill="var(--psm-surface)"
                  stroke={trendColor}
                  strokeWidth="2.5"
                  className="transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip display */}
        {hoveredIdx !== null && coords[hoveredIdx] && coords[hoveredIdx]?.point && (
          <div className="mt-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--psm-text)]">
                {new Date(coords[hoveredIdx]!.point.period_start_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="rounded bg-[var(--psm-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--psm-muted)]">
                Status: {coords[hoveredIdx]!.point.point_status}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm font-bold text-[var(--psm-primary)]">
              {metricLabel}:{' '}
              {coords[hoveredIdx]!.point.metric_value !== null
                ? coords[hoveredIdx]!.point.metric_value?.toFixed(2)
                : 'No Observation'}
            </p>
            <p className="text-[11px] text-[var(--psm-muted)]">
              Samples: {coords[hoveredIdx]!.point.observation_count} · Quality:{' '}
              {coords[hoveredIdx]!.point.data_quality_status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
