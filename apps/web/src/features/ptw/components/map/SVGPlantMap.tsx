'use client';

import type { PTWMapData } from '../../services/ptw-map.service';
import { ConflictMarker } from './ConflictMarker';
import { EquipmentMarker } from './EquipmentMarker';
import { PermitMarker } from './PermitMarker';

type Selected = { type: 'permit' | 'equipment' | 'conflict' | 'area' | 'alert'; id: string } | null;

export function SVGPlantMap({ map, selected, onSelect }: { map: PTWMapData; selected: Selected; onSelect: (item: NonNullable<Selected>) => void }) {
  return (
    <div className="relative min-h-[540px] overflow-hidden rounded-xl border border-cyan-300/10 bg-[#061424] shadow-2xl shadow-black/25">
      {map.layout?.svg_file_url || map.layout?.image_file_url ? (
        <img src={map.layout.svg_file_url ?? map.layout.image_file_url ?? ''} alt={map.layout.layout_name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(56,189,248,.14)_1px,transparent_1px),linear-gradient(rgba(56,189,248,.14)_1px,transparent_1px)] bg-[length:34px_34px]" />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(30,64,175,.18),transparent_36%),linear-gradient(180deg,rgba(2,6,23,.05),rgba(2,6,23,.45))]" />
      {map.zones.map((zone) => (
        <button
          type="button"
          key={zone.id}
          onClick={() => onSelect({ type: 'area', id: String(zone.area_id ?? zone.id) })}
          className="absolute z-0 rounded-lg border border-cyan-300/20 bg-cyan-400/5 text-left text-[10px] font-semibold uppercase tracking-wide text-cyan-100/80 transition hover:border-cyan-200/60 hover:bg-cyan-400/10"
          style={{ left: `${Number(zone.x ?? 0)}%`, top: `${Number(zone.y ?? 0)}%`, width: `${Number(zone.width ?? 18)}%`, height: `${Number(zone.height ?? 14)}%` }}
        >
          <span className="absolute left-2 top-2">{zone.zone_name ?? zone.name ?? 'Zone'}</span>
        </button>
      ))}
      {map.equipment.map((equipment) => (
        <EquipmentMarker key={equipment.equipment_id} equipment={equipment} selected={selected?.type === 'equipment' && selected.id === equipment.equipment_id} onSelect={() => onSelect({ type: 'equipment', id: equipment.equipment_id })} />
      ))}
      {map.permits.map((permit) => (
        <PermitMarker key={permit.permit_id} permit={permit} selected={selected?.type === 'permit' && selected.id === permit.permit_id} onSelect={() => onSelect({ type: 'permit', id: permit.permit_id })} />
      ))}
      {map.conflicts.map((conflict) => (
        <ConflictMarker key={String(conflict.id)} conflict={conflict} selected={selected?.type === 'conflict' && selected.id === String(conflict.id)} onSelect={() => onSelect({ type: 'conflict', id: String(conflict.id) })} />
      ))}
    </div>
  );
}
