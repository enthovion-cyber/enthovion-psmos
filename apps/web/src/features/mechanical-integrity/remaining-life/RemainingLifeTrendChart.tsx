'use client';

import React, { useState } from 'react';
import type { MiRemainingLifeEvaluation } from '../types/inspection-record.types';

export function RemainingLifeTrendChart({ rows }: { rows: MiRemainingLifeEvaluation[] }) {
  const [selectedCml, setSelectedCml] = useState<string | null>(rows[0]?.cml_id ?? null);

  if (!rows || rows.length === 0) {
    return null;
  }

  const selected = rows.find((r) => r.cml_id === selectedCml) ?? rows[0];

  // Find max thickness across all rows for scaling SVG
  const maxThickness = Math.max(
    ...rows.map((r) => Math.max(Number(r.current_thickness ?? 0), Number(r.minimum_required_thickness ?? 0))),
    0.5
  );

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--psm-text)]">CML Thickness Degradation & Remaining Life Profile</h2>
          <p className="text-xs text-[var(--psm-muted)]">
            API 510 / API 570 degradation modeling: Actual vs. Minimum thickness ($t_{'{actual}'}$ vs. $t_{'{min}'}$)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" />
            <span className="text-[var(--psm-muted)]">Current Thickness ($t$)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-danger" />
            <span className="text-[var(--psm-muted)]">Retirement Limit ($t_{'{min}'}$)</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="mt-6 space-y-4">
        {rows.slice(0, 8).map((row) => {
          const current = Number(row.current_thickness ?? 0);
          const min = Number(row.minimum_required_thickness ?? 0);
          const currentPct = maxThickness > 0 ? Math.min(100, Math.max(0, (current / maxThickness) * 100)) : 0;
          const minPct = maxThickness > 0 ? Math.min(100, Math.max(0, (min / maxThickness) * 100)) : 0;
          const remainingYears = row.remaining_life_years;
          const isSelected = row.cml_id === selected?.cml_id;

          const isCritical = typeof remainingYears === 'number' && remainingYears < 2;
          const isWarning = typeof remainingYears === 'number' && remainingYears >= 2 && remainingYears <= 10;
          const isHealthy = typeof remainingYears === 'number' && remainingYears > 10;

          const badgeBg = isCritical ? 'bg-danger/20 text-danger border-danger/40' : isWarning ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' : isHealthy ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';

          const tag = row.cml?.cml_number ?? row.cmlNumber ?? row.cml_id;

          return (
            <div
              key={row.id ?? row.cml_id}
              onClick={() => setSelectedCml(row.cml_id)}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 hover:border-[var(--psm-line)]/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--psm-text)]">{tag} - {row.cml?.location_description || 'Condition Monitoring Location'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--psm-muted)]">
                    $t$: <strong className="text-[var(--psm-text)]">{current.toFixed(3)}</strong> | $t_{'{min}'}$: <strong className="text-danger">{min.toFixed(3)}</strong>
                  </span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${badgeBg}`}>
                    {typeof remainingYears === 'number' ? `${remainingYears.toFixed(1)} yrs remaining` : 'Life: N/A'}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative mt-2 h-4 w-full overflow-hidden rounded bg-[var(--psm-surface-2)]">
                {/* Current Thickness Fill */}
                <div
                  className={`h-full transition-all ${
                    isCritical ? 'bg-danger' : isWarning ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${currentPct}%` }}
                />
                {/* Min Thickness Marker */}
                {minPct > 0 ? (
                  <div
                    className="absolute top-0 bottom-0 z-10 w-1 bg-danger shadow"
                    style={{ left: `${minPct}%` }}
                    title={`Retirement threshold: ${min}`}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected CML Deep Dive Card */}
      {selected ? (
        <div className="mt-5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-xs">
          <p className="font-bold uppercase tracking-wider text-primary">Selected CML Analytical Breakdown</p>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <span className="text-[var(--psm-muted)]">Short-Term Corrosion Rate:</span>
              <p className="font-semibold text-[var(--psm-text)]">{selected.short_term_corrosion_rate ?? '0.000'} in/yr</p>
            </div>
            <div>
              <span className="text-[var(--psm-muted)]">Long-Term Corrosion Rate:</span>
              <p className="font-semibold text-[var(--psm-text)]">{selected.long_term_corrosion_rate ?? '0.000'} in/yr</p>
            </div>
            <div>
              <span className="text-[var(--psm-muted)]">Governing Rate Method:</span>
              <p className="font-semibold text-[var(--psm-text)]">{selected.governing_rate_method ?? 'Conservative Short/Long'}</p>
            </div>
            <div>
              <span className="text-[var(--psm-muted)]">Half-Life Inspection Due:</span>
              <p className="font-semibold text-primary">{selected.half_life_due_date || 'Schedule not generated'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
