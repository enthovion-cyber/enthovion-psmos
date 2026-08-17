import Link from 'next/link';
import { ElectricalClassificationBadge } from '../components/shared/ElectricalClassificationBadge';
import { ElectricalCompletenessBadge } from '../components/shared/ElectricalCompletenessBadge';
import { ElectricalConflictBadge } from '../components/shared/ElectricalConflictBadge';
import { ExProtectionBadge } from '../components/shared/ExProtectionBadge';
import { GasDustGroupBadge } from '../components/shared/GasDustGroupBadge';
import { TemperatureClassBadge } from '../components/shared/TemperatureClassBadge';
import { ZoneClassDivisionBadge } from '../components/shared/ZoneClassDivisionBadge';
import type { ElectricalClassification } from '../types/electrical-classification.types';

export function ElectricalClassificationTable({ rows }: { rows: ElectricalClassification[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Record', 'Area / Unit', 'Material / Source', 'Zone / Division', 'Group', 'T Class', 'Protection', 'Equipment Rating', 'Completeness', 'Conflicts', 'MOC/PSSR'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-[var(--psm-surface-2)]">
              <td className="px-4 py-3"><Link className="font-semibold text-primary" href={`/process-safety-information/electrical-classification/${row.id}`}>{row.classification_record_number || row.classification_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.classification_title}</p><ElectricalClassificationBadge value={row.classification_status} /></td>
              <td className="px-4 py-3">{row.building_location || row.area_id || 'Area missing'}<p className="text-xs text-[var(--psm-muted)]">{row.unit_id}</p></td>
              <td className="px-4 py-3">{row.hazardous_material_name || 'Material missing'}<p className="text-xs text-[var(--psm-muted)]">{row.release_source_type || 'Release source missing'}</p></td>
              <td className="px-4 py-3"><ZoneClassDivisionBadge zone={row.zone_classification} division={row.nec_class_division} /></td>
              <td className="px-4 py-3"><GasDustGroupBadge gasGroup={row.gas_group} dustGroup={row.dust_group} /></td>
              <td className="px-4 py-3"><TemperatureClassBadge value={row.temperature_class} /></td>
              <td className="px-4 py-3"><ExProtectionBadge value={row.required_protection_method} /></td>
              <td className="px-4 py-3">{row.rating_compliance_status || 'Not checked'}</td>
              <td className="px-4 py-3"><ElectricalCompletenessBadge value={row.completeness_status} score={row.completeness_score} /></td>
              <td className="px-4 py-3"><ElectricalConflictBadge value={row.conflict_status} /></td>
              <td className="px-4 py-3"><span className={row.moc_update_required ? 'text-warning' : 'text-[var(--psm-muted)]'}>{row.moc_update_required ? 'MOC required' : 'No MOC flag'}</span><br /><span className={row.pssr_blocker ? 'text-danger' : 'text-[var(--psm-muted)]'}>{row.pssr_blocker ? 'PSSR blocker' : 'No PSSR blocker'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
