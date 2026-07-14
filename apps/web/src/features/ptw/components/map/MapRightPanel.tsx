'use client';

import { AlertTriangle, Bell, ChevronRight, Gauge, X } from 'lucide-react';
import type { PTWMapData } from '../../services/ptw-map.service';
import { AreaSummaryCard } from './AreaSummaryCard';
import { SelectedPermitPreview } from './SelectedPermitPreview';
import { formatDateTime } from './map-utils';

type Selected = { type: 'permit' | 'equipment' | 'conflict' | 'area' | 'alert'; id: string } | null;

export function MapRightPanel({ map, selected, onClose, onSelect }: { map: PTWMapData; selected: Selected; onClose: () => void; onSelect: (item: NonNullable<Selected>) => void }) {
  const selectedPermit = selected?.type === 'permit' ? map.permits.find((permit) => permit.permit_id === selected.id) : null;
  const selectedArea = selected?.type === 'area'
    ? map.areas.find((area) => String(area.area_id ?? area.area_name) === selected.id)
    : selectedPermit
      ? map.areas.find((area) => String(area.area_id ?? '') === String(selectedPermit.area_id ?? ''))
      : null;
  const selectedEquipment = selected?.type === 'equipment' ? map.equipment.find((equipment) => equipment.equipment_id === selected.id) : null;
  const selectedConflict = selected?.type === 'conflict' ? map.conflicts.find((conflict) => String(conflict.id) === selected.id) : null;

  return (
    <aside className="space-y-3 rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-3 shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Live Map Inspector</h2>
          <p className="text-xs text-slate-400">{map.permits.length} permits / {map.conflicts.length} conflicts</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Close map inspector"><X size={16} /></button>
      </div>
      <SelectedPermitPreview permit={selectedPermit} />
      {selectedEquipment ? (
        <div className="rounded-lg border border-cyan-300/10 bg-cyan-500/5 p-3">
          <p className="text-xs uppercase tracking-wide text-cyan-200">Equipment</p>
          <h3 className="mt-1 text-base font-bold text-white">{selectedEquipment.equipment_tag}</h3>
          <p className="text-sm text-slate-300">{selectedEquipment.equipment_name}</p>
          <p className="mt-2 text-xs text-slate-400">{selectedEquipment.active_permit_count} active permits on this equipment</p>
        </div>
      ) : null}
      {selectedConflict ? (
        <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-3">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-200"><AlertTriangle size={14} /> Conflict</p>
          <h3 className="mt-2 text-sm font-bold text-white">{selectedConflict.conflict_type ?? 'PTW conflict'}</h3>
          <p className="mt-1 text-xs text-slate-300">{selectedConflict.description ?? 'SIMOPS conflict requires review.'}</p>
        </div>
      ) : null}
      <AreaSummaryCard area={selectedArea} />
      <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300"><Gauge size={14} /> Conflict Summary</p>
        {map.conflicts.slice(0, 4).map((conflict) => (
          <button key={String(conflict.id)} type="button" onClick={() => onSelect({ type: 'conflict', id: String(conflict.id) })} className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.04]">
            <span className="min-w-0 truncate">{conflict.description ?? conflict.conflict_type}</span>
            <ChevronRight size={13} className="shrink-0 text-slate-500" />
          </button>
        ))}
        {!map.conflicts.length ? <p className="text-xs text-slate-500">No open conflicts match the current filters.</p> : null}
      </div>
      <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300"><Bell size={14} /> Live Alerts</p>
        {map.alerts.slice(0, 5).map((alert) => (
          <div key={String(alert.id)} className="border-b border-white/10 py-2 last:border-b-0">
            <p className="text-xs font-semibold text-white">{alert.message ?? alert.type}</p>
            <p className="text-[11px] text-slate-500">{formatDateTime(alert.timestamp ?? alert.created_at)}</p>
          </div>
        ))}
        {!map.alerts.length ? <p className="text-xs text-slate-500">No live map alerts.</p> : null}
      </div>
    </aside>
  );
}
