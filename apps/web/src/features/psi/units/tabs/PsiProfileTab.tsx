import type { PsiUnitDetailResponse } from '../../types/psi-unit.types';
import { PsiCard } from '../../shared/PsiUi';

export function PsiProfileTab({ detail }: { detail: PsiUnitDetailResponse }) {
  const unit = detail.unit;
  const sections: Array<[string, unknown]> = [
    ['Unit identity', `${unit.unit_code} - ${unit.unit_name} (${unit.unit_type})`],
    ['Location / battery limits', unit.battery_limits ?? unit.building_location ?? 'Missing location scope'],
    ['Process description', unit.process_purpose ?? 'Missing process purpose'],
    ['Process flow summary', unit.process_flow_summary ?? 'Missing process flow summary'],
    ['Main chemicals foundation', unit.major_chemical_hazards ?? 'Missing chemical hazards/SDS foundation'],
    ['Major hazards summary', unit.major_process_hazards ?? 'Missing major hazards summary'],
    ['Main equipment foundation', `${detail.equipment.length} equipment links`],
    ['Operating envelope foundation', unit.normal_operation_summary ?? 'Missing safe operating limit foundation'],
    ['Relief systems foundation', unit.pressure_temperature_hazards ?? 'Missing relief basis foundation'],
    ['Safeguards foundation', unit.critical_safeguards_summary ?? 'Missing safeguard/control basis'],
    ['Critical documents foundation', `${detail.documents.length} document links`],
    ['Ownership/review status', `${unit.owner?.displayName ?? unit.psi_owner_id ?? 'Owner missing'} / ${unit.review_status}`],
    ['Completeness status', `${unit.completeness_status} (${Math.round(Number(unit.completeness_score ?? 0))}%)`],
    ['Last changes', detail.history[0]?.event_title ?? 'No history yet']
  ];
  return <div className="grid gap-4 lg:grid-cols-2">{sections.map(([title, body]) => <PsiCard key={title} title={title}><p className="text-sm text-[var(--psm-muted)]">{String(body)}</p></PsiCard>)}</div>;
}
