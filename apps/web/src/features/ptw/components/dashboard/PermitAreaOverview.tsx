import React, { useMemo } from 'react';
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
    <section className="w-full max-w-lg rounded-xl border border-slate-800/80 bg-[#070f1e] p-5 shadow-2xl select-none">
      
      {/* Header Layout */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Map size={16} className="text-blue-400" />
          Permit Map (Live)
        </h3>
        <a 
          href="/ptw/map" 
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
        >
          View Full Map →
        </a>
      </div>

      {/* Geospatial Radar Grid Box */}
      <div className="relative mb-4 aspect-[2.4/1] w-full overflow-hidden rounded-lg border border-slate-800 bg-[#030712]">
        {/* Dynamic Vector Radar Mesh Grids */}
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-2 rounded border border-sky-500/10 pointer-events-none" />
        
        {/* Plotted Live Mapped Coordinates */}
        {locations.slice(0, 20).map((location, index) => {
          // Normalize coordinates safely ensuring bounded ranges inside parent constraints
          const rawX = Number(location.svg_x ?? location.x ?? 12 + (index % 5) * 18);
          const rawY = Number(location.svg_y ?? location.y ?? 24 + Math.floor(index / 5) * 20);
          
          const posX = Math.min(94, Math.max(4, rawX));
          const posY = Math.min(86, Math.max(8, rawY));

          const severity = String(location.highest_conflict_severity ?? location.risk_level ?? 'Low');
          
          // Generate semantic style palettes for threat profiles
          const statusThemes = 
            severity === 'Critical' || severity === 'High' 
              ? 'bg-red-500 shadow-red-500/50 ring-red-400/30' 
              : severity === 'Medium' 
                ? 'bg-amber-400 shadow-amber-400/50 ring-amber-300/30' 
                : 'bg-emerald-400 shadow-emerald-400/50 ring-emerald-300/30';

          return (
            <span
              key={`${location.permit_id ?? location.id ?? index}`}
              className={`absolute h-2.5 w-2.5 rounded-full ring-4 shadow-[0_0_10px_2px] animate-pulse transition-transform hover:scale-125 cursor-crosshair ${statusThemes}`}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              title={`${String(location.permit_number ?? 'Permit Marker')} | Risk: ${severity}`}
            />
          );
        })}

        {/* Empty State Vector Overlay */}
        {!locations.length && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <Layers className="text-slate-600 mb-1.5" size={20} />
            <p className="text-xs text-slate-500 font-medium">No active permits mapped in this tracking sector.</p>
          </div>
        )}
      </div>

      {/* Monitored Systems Operational Unit Cards Grid */}
      <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700">
        {units.slice(0, 6).map((unit) => {
          const riskTone = toneClass(unit.highestRisk);
          
          return (
            <div 
              key={unit.id} 
              className="rounded-lg border border-slate-800/60 bg-slate-900/10 p-3 flex flex-col justify-between transition-all hover:bg-slate-900/20 hover:border-slate-800"
            >
              {/* Unit Meta Profile Info Container */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-200 text-sm truncate tracking-wide">
                    {unit.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <Activity size={10} className="text-slate-500" />
                    {unit.areas.length} zones under management
                  </p>
                </div>
                
                {/* Threat Category Badge Indicator */}
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded border flex-shrink-0 uppercase ${
                  riskTone.includes('red') || riskTone.includes('rose') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  riskTone.includes('amber') || riskTone.includes('yellow') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {unit.highestRisk || 'Low'}
                </span>
              </div>

              {/* Aggregated Local Metric Slots */}
              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="Active" value={unit.activePermits} tone="text-emerald-400" />
                <MetricCard label="Conflicts" value={unit.conflicts} tone={unit.conflicts > 0 ? 'text-red-400 font-extrabold' : 'text-slate-400'} showWarningIcon={unit.conflicts > 0} />
                <MetricCard label="Expiring" value={unit.expiringSoon} tone="text-amber-400" />
              </div>

            </div>
          );
        })}

        {/* Units Empty Block Container Layout */}
        {!units.length && (
          <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center bg-slate-950/10">
            <ShieldAlert size={22} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium">No zone map metrics configured for this facility.</p>
          </div>
        )}
      </div>

    </section>
  );
}

/**
 * Isolated Metric Sub-Card Layout Optimized Against Cell Text-Overflow Under Compact Containers
 */
interface MetricCardProps {
  label: string;
  value: number;
  tone: string;
  showWarningIcon?: boolean;
}

function MetricCard({ label, value, tone, showWarningIcon = false }: MetricCardProps) {
  return (
    <div className="rounded border border-slate-800/40 bg-[#040914] p-1.5 flex flex-col items-center justify-center min-w-0 text-center">
      <div className={`text-base font-bold font-mono tracking-tight truncate w-full flex items-center justify-center gap-1 ${tone}`}>
        {showWarningIcon && <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block animate-ping flex-shrink-0" />}
        {value}
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate w-full">
        {label}
      </div>
    </div>
  );
}