import Link from 'next/link';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { ReliefCompletenessBadge } from '../shared/ReliefCompletenessBadge';
import { ReliefConflictBadge } from '../shared/ReliefConflictBadge';
import { ReliefDeviceStatusBadge } from '../shared/ReliefDeviceStatusBadge';
import { ReliefSystemTypeBadge } from '../shared/ReliefSystemTypeBadge';
import type { ReliefSystem } from '../types/relief-system.types';

export function ReliefSystemMobileCards({ rows }: { rows: ReliefSystem[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/process-safety-information/relief-systems/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-primary">{row.relief_basis_number ?? row.relief_basis_title}</h3>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{row.protected_equipment_tag} - {row.protected_equipment_name}</p>
            </div>
            <ReliefSystemTypeBadge value={row.relief_system_type} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ReliefDeviceStatusBadge value={row.relief_device_status ?? (row.mi_relief_device_id ? 'Linked' : 'Not linked')} />
            <ReliefCompletenessBadge value={row.completeness_status} score={row.completeness_score ?? null} />
            <ReliefConflictBadge value={row.conflict_status} />
            <MocRequiredBadge value={row.moc_update_required} />
            <PssrBlockerBadge value={row.pssr_blocker} />
          </div>
          <p className="mt-3 text-xs text-[var(--psm-muted)]">Governing: {row.governing_scenario_type ?? 'Missing'} / Destination: {row.relief_destination ?? 'Missing'}</p>
        </Link>
      ))}
    </div>
  );
}
