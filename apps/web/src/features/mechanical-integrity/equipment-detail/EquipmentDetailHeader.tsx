import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import type { MiEquipment, MiEquipmentAction } from '../types/equipment.types';
import { EquipmentStatusBadge } from '../shared/EquipmentStatusBadge';
import { EquipmentCriticalityBadge } from '../shared/EquipmentCriticalityBadge';
import { FitnessStatusBadge } from '../shared/FitnessStatusBadge';
import { BypassStatusBadge } from '../shared/BypassStatusBadge';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';
import { EquipmentDetailActions } from './EquipmentDetailActions';

export function EquipmentDetailHeader({ equipment, actions, onAction }: { equipment: MiEquipment; actions: MiEquipmentAction[]; onAction: (key: string) => void }) {
  const updatedAt = equipment.updatedAt ?? equipment.updated_at ?? null;
  const createdAt = equipment.createdAt ?? equipment.created_at ?? null;
  return (
    <header className="sticky top-0 z-20 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/mechanical-integrity/equipment" className="text-xs font-semibold text-primary hover:underline">Equipment Registry</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{equipment.tag} - {equipment.name}</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{[equipment.type, equipment.subtype ?? equipment.classification, equipment.fluidName ?? equipment.fluidService].filter(Boolean).join(' / ')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <EquipmentStatusBadge value={equipment.status} />
            <EquipmentCriticalityBadge value={equipment.criticality} />
            {equipment.safetyCritical ? <span className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Safety-Critical</span> : null}
            {equipment.psmCritical ? <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">PSM-Critical</span> : null}
            <FitnessStatusBadge value={equipment.fitnessStatus} />
            <StartupBlockedBadge blocked={equipment.startupBlocked} />
            <BypassStatusBadge active={equipment.bypassActive} />
            <DeficiencyStatusBadge count={equipment.openDeficiencyCount} />
          </div>
          <div className="mt-4 grid gap-2 text-xs text-[var(--psm-muted)] md:grid-cols-2 xl:grid-cols-3">
            <span className="inline-flex items-center gap-2"><MapPin size={14} /> {[equipment.site?.name, equipment.unit?.name, equipment.area?.name, equipment.buildingZone].filter(Boolean).join(' / ') || 'Location not configured'}</span>
            <span>Owner department: <b className="text-[var(--psm-text)]">{equipment.ownerDepartmentId ?? equipment.companyName ?? '-'}</b></span>
            <span>Custodian: <b className="text-[var(--psm-text)]">{equipment.custodianUserId ?? '-'}</b></span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={14} /> Created: {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}</span>
            <span>Last updated: <b className="text-[var(--psm-text)]">{updatedAt ? new Date(updatedAt).toLocaleString() : '-'}</b></span>
            <span>Service fluid / chemical: <b className="text-[var(--psm-text)]">{equipment.fluidName ?? equipment.fluidService ?? '-'}</b></span>
          </div>
        </div>
        <EquipmentDetailActions actions={actions} onAction={onAction} />
      </div>
    </header>
  );
}
