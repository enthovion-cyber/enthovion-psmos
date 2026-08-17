import Link from 'next/link';
import { DesignBasisCompletenessBadge } from '../shared/DesignBasisCompletenessBadge';
import { DesignBasisConflictBadge } from '../shared/DesignBasisConflictBadge';
import { EquipmentCriticalityBadge } from '../shared/EquipmentCriticalityBadge';
import type { EquipmentDesignBasis } from '../types/equipment-design.types';

export function EquipmentDesignMobileCards({ rows }: { rows: EquipmentDesignBasis[] }) {
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/process-safety-information/equipment-design/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-primary">{row.equipment_tag}</p><p className="text-sm text-[var(--psm-muted)]">{row.equipment_name}</p></div><EquipmentCriticalityBadge value={row.equipment_criticality} /></div>
    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><span>{row.equipment_type}</span><span>{row.service_fluid ?? 'Missing service'}</span><DesignBasisCompletenessBadge value={row.completeness_status} score={row.completeness_score ?? null} /><DesignBasisConflictBadge value={row.conflict_status} /></div>
  </Link>)}</div>;
}
