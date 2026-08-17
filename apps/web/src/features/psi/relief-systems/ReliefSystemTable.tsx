import Link from 'next/link';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { ReliefCompletenessBadge } from '../shared/ReliefCompletenessBadge';
import { ReliefConflictBadge } from '../shared/ReliefConflictBadge';
import { ReliefDeviceStatusBadge } from '../shared/ReliefDeviceStatusBadge';
import { ReliefScenarioBadge } from '../shared/ReliefScenarioBadge';
import { ReliefSystemTypeBadge } from '../shared/ReliefSystemTypeBadge';
import type { ReliefSystem } from '../types/relief-system.types';

export function ReliefSystemTable({ rows }: { rows: ReliefSystem[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{['Relief Basis', 'Protected Equipment', 'Type / Device', 'Governing Case', 'Sizing / Capacity', 'Destination', 'Completeness', 'Conflict', 'Review', 'MOC', 'PSSR', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <Link className="font-semibold text-primary hover:underline" href={`/process-safety-information/relief-systems/${row.id}`}>{row.relief_basis_number ?? row.relief_basis_title}</Link>
                <p className="mt-1 max-w-xs text-xs text-[var(--psm-muted)]">{row.relief_basis_title}</p>
              </td>
              <td className="px-4 py-3">{row.protected_equipment_tag}<p className="text-xs text-[var(--psm-muted)]">{row.protected_equipment_name}</p></td>
              <td className="px-4 py-3"><ReliefSystemTypeBadge value={row.relief_system_type} /><p className="mt-2"><ReliefDeviceStatusBadge value={row.relief_device_status ?? (row.mi_relief_device_id ? 'Linked' : 'Not linked')} /></p></td>
              <td className="px-4 py-3"><ReliefScenarioBadge value={row.governing_scenario_type} /><p className="mt-1 max-w-xs text-xs text-[var(--psm-muted)]">{row.governing_scenario_description ?? 'No governing case description'}</p></td>
              <td className="px-4 py-3">{row.required_relief_rate ?? '-'} {row.required_relief_rate_unit ?? ''}<p className="text-xs text-[var(--psm-muted)]">Rated {row.rated_capacity ?? '-'} {row.rated_capacity_unit ?? ''} / Margin {row.capacity_margin_percent ?? '-'}%</p></td>
              <td className="px-4 py-3">{row.relief_destination ?? 'Missing'}<p className="text-xs text-[var(--psm-muted)]">{row.destination_detail ?? 'No detail'}</p></td>
              <td className="px-4 py-3"><ReliefCompletenessBadge value={row.completeness_status} score={row.completeness_score ?? null} /></td>
              <td className="px-4 py-3"><ReliefConflictBadge value={row.conflict_status} /></td>
              <td className="px-4 py-3">{row.review_status}</td>
              <td className="px-4 py-3"><MocRequiredBadge value={row.moc_update_required} /></td>
              <td className="px-4 py-3"><PssrBlockerBadge value={row.pssr_blocker} /></td>
              <td className="px-4 py-3"><Link className="text-primary hover:underline" href={`/process-safety-information/relief-systems/${row.id}/edit`}>Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
