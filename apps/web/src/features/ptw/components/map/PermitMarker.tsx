'use client';

import type { PTWMapPermitItem } from '../../services/ptw-map.service';
import { markerTitle, riskTone } from './map-utils';

export function PermitMarker({ permit, selected, onSelect }: { permit: PTWMapPermitItem; selected?: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      title={markerTitle(permit)}
      onClick={onSelect}
      className={`absolute z-20 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[10px] font-black shadow-lg transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300 ${riskTone(permit.risk_level)} ${selected ? 'ring-4 ring-white/40' : ''}`}
      style={{ left: `${permit.svg_x}%`, top: `${permit.svg_y}%` }}
      aria-label={`Open ${permit.permit_number} map preview`}
    >
      P
      {permit.has_conflict ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white/70 bg-red-600" /> : null}
    </button>
  );
}
