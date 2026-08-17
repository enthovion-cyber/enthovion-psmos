import Link from 'next/link';
import { CompatibilityRatingBadge, MaterialCompletenessBadge, MaterialConflictBadge, MaterialFamilyBadge, MiReadinessImpactBadge, MocRequiredBadge, PssrBlockerBadge } from '../shared/MaterialCompatibilityBadges';
import type { MaterialCompatibilityRow } from '../types/material-compatibility.types';

export function MaterialCompatibilityTable({ rows }: { rows: MaterialCompatibilityRow[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Record', 'Chemical / Service', 'Material / Component', 'Conditions', 'Rating', 'Degradation', 'Completeness', 'Conflicts', 'MOC/PSSR/MI'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-[var(--psm-surface-2)]">
              <td className="px-4 py-3"><Link className="font-semibold text-primary" href={`/process-safety-information/material-compatibility/${row.id}`}>{row.compatibility_record_number || row.compatibility_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.compatibility_title}</p></td>
              <td className="px-4 py-3">{row.chemical_name || row.chemical_id || 'Chemical missing'}<p className="text-xs text-[var(--psm-muted)]">{row.cas_number || row.system_service || 'CAS/service missing'}</p></td>
              <td className="px-4 py-3"><MaterialFamilyBadge value={row.material_family} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.material_grade || row.component_type || 'Grade/component missing'}</p></td>
              <td className="px-4 py-3">{row.serviceConditions?.min_temperature ?? 'T?'} - {row.serviceConditions?.max_temperature ?? 'T?'} {row.serviceConditions?.temperature_unit ?? ''}<p className="text-xs text-[var(--psm-muted)]">pH {row.serviceConditions?.ph_min ?? '?'} - {row.serviceConditions?.ph_max ?? '?'}</p></td>
              <td className="px-4 py-3"><CompatibilityRatingBadge value={row.compatibility_rating} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.rating_confidence || 'Confidence missing'}</p></td>
              <td className="px-4 py-3">{row.degradation_mechanism_summary || 'None recorded'}</td>
              <td className="px-4 py-3"><MaterialCompletenessBadge value={row.completeness_status} score={row.completeness_score} /></td>
              <td className="px-4 py-3"><MaterialConflictBadge value={row.conflict_status} /></td>
              <td className="px-4 py-3"><div className="flex flex-col gap-1"><MocRequiredBadge value={row.moc_update_required} /><PssrBlockerBadge value={row.pssr_blocker} /><MiReadinessImpactBadge value={row.mi_readiness_impact} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
