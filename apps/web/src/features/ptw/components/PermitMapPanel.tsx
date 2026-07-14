import Link from 'next/link';

type LegacyPoint = { id: string; label: string; x: number; y: number; permit?: { id: string; status: string; equipment_tag?: string | null } };
type MapPayload = { permits?: Array<{ permit_id: string; permit_number: string; svg_x: number; svg_y: number; status: string; equipment_tag?: string | null }> };

export function PermitMapPanel({ points }: { points: LegacyPoint[] | MapPayload }) {
  const normalized = Array.isArray(points)
    ? points
    : (points?.permits ?? []).map((permit) => ({
      id: permit.permit_id,
      label: permit.permit_number,
      x: permit.svg_x,
      y: permit.svg_y,
      permit: { id: permit.permit_id, status: permit.status, equipment_tag: permit.equipment_tag }
    }));

  return (
    <div className="relative h-40 overflow-hidden rounded-lg border border-[var(--psm-line)] bg-[linear-gradient(90deg,rgba(59,130,246,.18)_1px,transparent_1px),linear-gradient(rgba(59,130,246,.18)_1px,transparent_1px)] bg-[length:22px_22px]">
      {normalized.map((point) => <Link key={point.id} href={point.permit?.id ? `/ptw/${point.permit.id}` : '/ptw/map'} title={`${point.label} ${point.permit?.equipment_tag ?? ''}`} className={`absolute h-4 w-4 rounded-full shadow-[0_0_0_8px_rgba(59,130,246,.15)] ${point.permit?.status === 'Suspended' ? 'bg-purple-500' : point.permit?.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} />)}
      {!normalized.length ? <div className="absolute inset-0 grid place-items-center text-xs text-[var(--psm-muted)]">No mapped permits</div> : null}
    </div>
  );
}
