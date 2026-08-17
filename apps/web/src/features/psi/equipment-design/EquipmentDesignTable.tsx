import Link from 'next/link';
import { DesignBasisCompletenessBadge } from '../shared/DesignBasisCompletenessBadge';
import { DesignBasisConflictBadge } from '../shared/DesignBasisConflictBadge';
import { EquipmentCriticalityBadge } from '../shared/EquipmentCriticalityBadge';
import { EquipmentDesignStatusBadge } from '../shared/EquipmentDesignStatusBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import type { EquipmentDesignBasis } from '../types/equipment-design.types';

export function EquipmentDesignTable({ rows }: { rows: EquipmentDesignBasis[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{['Equipment', 'Unit / Area', 'Type', 'Service', 'Design Ratings', 'Material / Code', 'Datasheet', 'Completeness', 'Conflict', 'Review', 'MOC', 'PSSR', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => <tr key={row.id}>
            <td className="px-4 py-3"><Link className="font-semibold text-primary hover:underline" href={`/process-safety-information/equipment-design/${row.id}`}>{row.equipment_tag}</Link><p className="mt-1 max-w-xs text-xs text-[var(--psm-muted)]">{row.equipment_name}</p></td>
            <td className="px-4 py-3">{row.unit_id}<p className="text-xs text-[var(--psm-muted)]">{row.area_id ?? 'No area'}</p></td>
            <td className="px-4 py-3">{row.equipment_type}<p className="mt-1"><EquipmentCriticalityBadge value={row.equipment_criticality} /></p></td>
            <td className="px-4 py-3">{row.service_fluid ?? 'Missing'}<p className="text-xs text-[var(--psm-muted)]">{row.fluid_phase ?? 'No phase'}</p></td>
            <td className="px-4 py-3">{row.ratings?.design_pressure ?? '-'} {row.ratings?.design_pressure_unit ?? ''}<p className="text-xs text-[var(--psm-muted)]">{row.ratings?.max_design_temperature ?? '-'} {row.ratings?.temperature_unit ?? ''}</p></td>
            <td className="px-4 py-3">{String(row.material?.material_of_construction ?? 'Missing')}<p className="text-xs text-[var(--psm-muted)]">{String(row.codes?.design_code ?? 'No design code')}</p></td>
            <td className="px-4 py-3">{row.missingDatasheet ? 'Missing' : 'Linked'}</td>
            <td className="px-4 py-3"><DesignBasisCompletenessBadge value={row.completeness_status} score={row.completeness_score ?? null} /></td>
            <td className="px-4 py-3"><DesignBasisConflictBadge value={row.conflict_status} /></td>
            <td className="px-4 py-3"><EquipmentDesignStatusBadge value={row.review_status} /></td>
            <td className="px-4 py-3"><MocRequiredBadge value={row.moc_update_required} /></td>
            <td className="px-4 py-3"><PssrBlockerBadge value={row.pssr_blocker} /></td>
            <td className="px-4 py-3"><Link className="text-primary hover:underline" href={`/process-safety-information/equipment-design/${row.id}/edit`}>Edit</Link></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
