'use client';

import { FallbackAreaMap } from './FallbackAreaMap';
import { MapLegend } from './MapLegend';
import { SVGPlantMap } from './SVGPlantMap';
import type { PTWMapData } from '../../services/ptw-map.service';

type Selected = { type: 'permit' | 'equipment' | 'conflict' | 'area' | 'alert'; id: string } | null;

export function PermitMapCanvas({ map, selected, onSelect }: { map: PTWMapData; selected: Selected; onSelect: (item: NonNullable<Selected>) => void }) {
  const hasLayout = Boolean(map.layout) || map.permits.some((permit) => permit.svg_x != null && permit.svg_y != null);
  return (
    <section className="space-y-3">
      {hasLayout ? <SVGPlantMap map={map} selected={selected} onSelect={onSelect} /> : <FallbackAreaMap map={map} selected={selected} onSelect={onSelect} />}
      <MapLegend />
    </section>
  );
}
