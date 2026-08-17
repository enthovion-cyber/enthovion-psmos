import Link from 'next/link';
import type { MiEquipment } from '../types/equipment.types';
import { EquipmentStatusBadge } from '../shared/EquipmentStatusBadge';
import { EquipmentCriticalityBadge } from '../shared/EquipmentCriticalityBadge';

export function EquipmentMobileCards({ rows }: { rows: MiEquipment[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/equipment/${row.id}`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-primary">{row.tag}</div><div className="text-sm">{row.name}</div></div><EquipmentStatusBadge value={row.status} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><EquipmentCriticalityBadge value={row.criticality} /><span className="rounded-full border border-[var(--psm-line)] px-2 py-1 text-xs">{row.type}</span></div>
          <div className="mt-3 text-xs text-[var(--psm-muted)]">{[row.site?.name, row.unit?.name, row.area?.name].filter(Boolean).join(' / ') || 'Location not configured'}</div>
        </Link>
      ))}
    </div>
  );
}
