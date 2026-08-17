import Link from 'next/link';
import { ElectricalCompletenessBadge } from '../components/shared/ElectricalCompletenessBadge';
import { ElectricalConflictBadge } from '../components/shared/ElectricalConflictBadge';
import { ZoneClassDivisionBadge } from '../components/shared/ZoneClassDivisionBadge';
import type { ElectricalClassification } from '../types/electrical-classification.types';

export function ElectricalClassificationMobileCards({ rows }: { rows: ElectricalClassification[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/process-safety-information/electrical-classification/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-primary">{row.classification_record_number || row.classification_title}</p><p className="text-sm text-[var(--psm-muted)]">{row.building_location || row.area_id || 'Area missing'}</p></div><ZoneClassDivisionBadge zone={row.zone_classification} division={row.nec_class_division} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><ElectricalCompletenessBadge value={row.completeness_status} score={row.completeness_score} /><ElectricalConflictBadge value={row.conflict_status} /></div>
          <p className="mt-3 text-sm">{row.hazardous_material_name || 'Hazardous material missing'} - {row.rating_compliance_status || 'rating not checked'}</p>
        </Link>
      ))}
    </div>
  );
}
