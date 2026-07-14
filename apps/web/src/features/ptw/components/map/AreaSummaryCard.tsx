'use client';

import type { PTWMapAreaItem } from '../../services/ptw-map.service';

export function AreaSummaryCard({ area }: { area: PTWMapAreaItem | null | undefined }) {
  if (!area) {
    return (
      <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3 text-sm text-slate-400">
        Select an area or permit marker to inspect live area risk and PTW loading.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">Area Summary</p>
      <h3 className="mt-1 text-base font-bold text-white">{area.area_name}</h3>
      <p className="text-xs text-slate-400">{area.unit_name}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Metric label="Active permits" value={area.active_permit_count} tone="text-emerald-300" />
        <Metric label="Conflicts" value={area.conflict_count} tone="text-red-300" />
        <Metric label="Expiring" value={area.expiring_count} tone="text-amber-300" />
        <Metric label="Gas retest due" value={area.gas_retest_due_count} tone="text-cyan-300" />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
      <div className="text-slate-400">{label}</div>
      <div className={`text-lg font-black ${tone}`}>{value}</div>
    </div>
  );
}
