'use client';

import { AlertTriangle } from 'lucide-react';

export function ConflictMarker({ conflict, selected, onSelect }: { conflict: Record<string, any>; selected?: boolean; onSelect: () => void }) {
  const x = Number(conflict.x ?? conflict.svg_x ?? 50);
  const y = Number(conflict.y ?? conflict.svg_y ?? 50);
  return (
    <button
      type="button"
      title={String(conflict.description ?? conflict.conflict_type ?? 'PTW conflict')}
      onClick={onSelect}
      className={`absolute z-30 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-red-200 bg-red-600 text-white shadow-lg shadow-red-500/40 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-200 ${selected ? 'ring-4 ring-white/40' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label="Open conflict preview"
    >
      <AlertTriangle size={15} />
    </button>
  );
}
