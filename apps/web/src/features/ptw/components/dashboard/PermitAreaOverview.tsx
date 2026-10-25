import React from 'react';
import { Map, Layers, ShieldAlert, Activity } from 'lucide-react';
import type { PermitDashboard } from '@/services/ptw.service';
import { toneClass } from './dashboard-ui';

interface PermitAreaOverviewProps {
  areaOverview?: PermitDashboard['areaOverview'];
}

export function PermitAreaOverview({ areaOverview }: PermitAreaOverviewProps) {
  const units = areaOverview?.units ?? [];
  const locations = (areaOverview?.mapLocations ?? []) as Array<Record<string, any>>;

  return (
    <section className="w-full rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Header Layout */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Map size={13} className="text-primary dark:text-sky-400" />
          Permit Map (Live)
        </h3>
        <a
          href="/ptw/map"
          className="text-xs font-bold text-primary dark:text-sky-400 hover:underline transition-colors flex items-center gap-0.5"
        >
          View Full Map →
        </a>
      </div>

      {/* Geospatial Radar Grid Box */}
      <div className="relative mb-2.5 aspect-[2.8/1] w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-[#030712]">
        {/* Dynamic Vector Radar Mesh Grids */}
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-2 rounded border border-sky-500/10 pointer-events-none" />

        {/* Plotted Live Mapped Coordinates */}
        {locations.slice(0, 20).map((location, index) => {
          const rawX = Number(location.svg_x ?? location.x ?? 12 + (index % 5) * 18);
          const rawY = Number(location.svg_y ?? location.y ?? 24 + Math.floor(index / 5) * 20);

          const posX = Math.min(94, Math.max(4, rawX));
          const posY = Math.min(86, Math.max(8, rawY));

          const severity = String(location.highest_conflict_severity ?? location.risk_level ?? 'Low');

          const statusThemes =
            severity === 'Critical' || severity === 'High'
              ? 'bg-red-500 shadow-red-500/50 ring-red-400/30'
              : severity === 'Medium'
                ? 'bg-amber-400 shadow-amber-400/50 ring-amber-300/30'
                : 'bg-emerald-400 shadow-emerald-400/50 ring-emerald-300/30';

          return (
            <span
              key={`${location.permit_id ?? location.id ?? index}`}
              className={`absolute h-2 w-2 rounded-full ring-2 shadow-[0_0_8px_1px] animate-pulse transition-transform hover:scale-125 cursor-crosshair ${statusThemes}`}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              title={`${String(location.permit_number ?? 'Permit Marker')} | Risk: ${severity}`}
            />
          );
        })}

        {/* Empty State Vector Overlay */}
        {!locations.length && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 bg-slate-50/60 dark:bg-slate-950/40 backdrop-blur-xs">
            <Layers className="text-slate-400 dark:text-slate-600 mb-1" size={16} />
            <p className="text-[11px] text-slate-500 font-medium">No active permits mapped in this tracking sector.</p>
          </div>
        )}
      </div>

      {/* Monitored Systems Operational Unit Cards Grid */}
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
        {units.slice(0, 4).map((unit) => {
          const riskTone = toneClass(unit.highestRisk);

          return (
            <div
              key={unit.id}
              className="rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/10 p-2 flex flex-col justify-between transition-all hover:bg-slate-100/70 dark:hover:bg-slate-900/20"
            >
              {/* Unit Meta Profile Info Container */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs truncate tracking-wide">
                    {unit.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <Activity size={9} className="text-slate-400" />
                    {unit.areas.length} zones
                  </p>
                </div>

                {/* Threat Category Badge Indicator */}
                <span
                  className={`text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded border shrink-0 uppercase ${
                    riskTone.includes('red') || riskTone.includes('rose')
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
                      : riskTone.includes('amber') || riskTone.includes('yellow')
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {unit.highestRisk || 'Low'}
                </span>
              </div>

              {/* Aggregated Local Metric Slots */}
              <div className="grid grid-cols-3 gap-1">
                <MetricCard label="Active" value={unit.activePermits} tone="text-emerald-700 dark:text-emerald-400" />
                <MetricCard
                  label="Conflicts"
                  value={unit.conflicts}
                  tone={unit.conflicts > 0 ? 'text-red-700 dark:text-red-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}
                  showWarningIcon={unit.conflicts > 0}
                />
                <MetricCard label="Expiring" value={unit.expiringSoon} tone="text-amber-700 dark:text-amber-400" />
              </div>
            </div>
          );
        })}

        {!units.length && (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center bg-slate-50/50 dark:bg-slate-950/10">
            <ShieldAlert size={22} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium">No zone map metrics configured for this facility.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
  showWarningIcon = false
}: {
  label: string;
  value: number;
  tone: string;
  showWarningIcon?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-[#040914] p-1.5 flex flex-col items-center justify-center min-w-0 text-center shadow-xs">
      <div className={`text-sm sm:text-base font-bold font-mono tracking-tight w-full flex items-center justify-center gap-1 ${tone}`}>
        {showWarningIcon && <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block animate-ping shrink-0" />}
        {value}
      </div>
      <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5 leading-tight text-center">
        {label}
      </div>
    </div>
  );
}
