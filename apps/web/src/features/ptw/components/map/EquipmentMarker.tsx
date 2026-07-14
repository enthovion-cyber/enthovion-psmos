'use client';

import { Wrench } from 'lucide-react';
import type { PTWMapEquipmentItem } from '../../services/ptw-map.service';

export function EquipmentMarker({ equipment, selected, onSelect }: { equipment: PTWMapEquipmentItem; selected?: boolean; onSelect: () => void }) {
  if (equipment.svg_x == null || equipment.svg_y == null) return null;
  const critical = (equipment.criticality ?? '').toLowerCase().includes('high');
  return (
    <button
      type="button"
      title={`${equipment.equipment_tag} - ${equipment.equipment_name}`}
      onClick={onSelect}
      className={`absolute z-10 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border shadow-md transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-300 ${critical ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-cyan-300 bg-cyan-500 text-slate-950'} ${selected ? 'ring-4 ring-white/35' : ''}`}
      style={{ left: `${equipment.svg_x}%`, top: `${equipment.svg_y}%` }}
      aria-label={`Open ${equipment.equipment_tag} equipment preview`}
    >
      <Wrench size={12} />
    </button>
  );
}
