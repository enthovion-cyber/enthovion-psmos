'use client';

import type { PTWMapData, PTWMapAreaItem } from '../../services/ptw-map.service';

type Selected = { type: 'permit' | 'equipment' | 'conflict' | 'area' | 'alert'; id: string } | null;

export function FallbackAreaMap({ map, selected, onSelect }: { map: PTWMapData; selected: Selected; onSelect: (item: NonNullable<Selected>) => void }) {
  const areas = map.areas.length ? map.areas : buildSingleArea(map);
  return (
    <div className="grid min-h-[540px] gap-3 rounded-xl border border-cyan-300/10 bg-[#061424] p-4 shadow-2xl shadow-black/25 md:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => {
        const selectedArea = selected?.type === 'area' && selected.id === String(area.area_id ?? area.area_name);
        return (
          <button
            type="button"
            key={String(area.area_id ?? area.area_name)}
            onClick={() => onSelect({ type: 'area', id: String(area.area_id ?? area.area_name) })}
            className={`min-h-40 rounded-lg border bg-slate-950/35 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300/50 ${selectedArea ? 'border-blue-300/70 ring-2 ring-blue-400/25' : 'border-cyan-300/10'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{area.unit_name}</p>
                <h3 className="mt-1 text-lg font-bold text-white">{area.area_name}</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200">{area.highest_risk}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Active" value={area.active_permit_count} tone="text-emerald-300" />
              <Metric label="Conflicts" value={area.conflict_count} tone="text-red-300" />
              <Metric label="Expiring" value={area.expiring_count} tone="text-amber-300" />
              <Metric label="Isolation" value={area.isolation_pending_count} tone="text-cyan-300" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function buildSingleArea(map: PTWMapData): PTWMapAreaItem[] {
  if (!map.permits.length) return [];
  return [{
    area_id: 'all',
    area_name: 'All mapped permits',
    unit_id: 'all',
    unit_name: 'Current filter',
    active_permit_count: map.permits.length,
    high_risk_count: map.permits.filter((permit) => permit.risk_level === 'High').length,
    critical_risk_count: map.permits.filter((permit) => permit.risk_level === 'Critical').length,
    conflict_count: map.permits.filter((permit) => permit.has_conflict).length,
    expiring_count: map.permits.filter((permit) => (permit.expires_in_minutes ?? 9999) <= 120).length,
    gas_retest_due_count: map.permits.filter((permit) => permit.gas_status !== 'PASS').length,
    isolation_pending_count: map.permits.filter((permit) => permit.isolation_status !== 'CONFIRMED').length,
    handover_pending_count: map.permits.filter((permit) => permit.handover_status !== 'COMPLETE').length,
    highest_risk: 'High',
    permits: map.permits
  }];
}
