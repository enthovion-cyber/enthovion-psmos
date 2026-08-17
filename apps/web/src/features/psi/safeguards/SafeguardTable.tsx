import Link from 'next/link';
import { IplQualificationBadge, MiReadinessImpactBadge, MocRequiredBadge, PssrBlockerBadge, SafeguardCompletenessBadge, SafeguardConflictBadge, SafeguardCriticalityBadge, SafeguardEffectivenessBadge, SafeguardImpairmentBadge, SafeguardSourceStatusBadge, SafeguardTestingStatusBadge, SafeguardTypeBadge } from '../shared/SafeguardBadges';
import type { SafeguardRow } from '../types/safeguard.types';

export function SafeguardTable({ rows }: { rows: SafeguardRow[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Safeguard / Control', 'Unit / Equipment', 'Type', 'Function', 'Hazard / Scenario Controlled', 'Linked Source Record', 'Criticality', 'Required Response', 'Effectiveness', 'Testing / Readiness', 'Bypass / Impairment', 'Evidence', 'Completeness', 'Conflict', 'Review', 'MOC/PSSR/MI', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-[var(--psm-surface-2)]">
              <td className="px-4 py-3"><Link className="font-semibold text-primary" href={`/process-safety-information/safeguards/${row.id}`}>{row.safeguard_tag || row.safeguard_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.safeguard_title}</p></td>
              <td className="px-4 py-3">{row.unit_id}<p className="text-xs text-[var(--psm-muted)]">{row.equipment_id || row.area_id || 'Unit-level safeguard'}</p></td>
              <td className="px-4 py-3"><SafeguardTypeBadge value={row.safeguard_type} /></td>
              <td className="px-4 py-3">{row.function_type}</td>
              <td className="px-4 py-3">{row.hazardLinks?.[0]?.scenario_title ?? 'Missing scenario'}<p className="text-xs text-[var(--psm-muted)]">{row.hazardLinks?.length ?? 0} linked</p></td>
              <td className="px-4 py-3">{row.sourceLinks?.[0]?.linked_record_tag_title ?? row.sourceLinks?.[0]?.linked_module ?? 'Missing'}<p className="text-xs text-[var(--psm-muted)]">{row.sourceLinks?.length ?? 0} source links</p></td>
              <td className="px-4 py-3"><SafeguardCriticalityBadge value={row.criticality} /></td>
              <td className="px-4 py-3">{row.functionRequirements?.required_response_time ?? row.required_response_time ?? 'Missing'}</td>
              <td className="px-4 py-3"><SafeguardEffectivenessBadge value={row.effectiveness_status ?? row.effectiveness?.effectiveness_status} /><p className="mt-1"><IplQualificationBadge value={row.effectiveness?.ipl_qualification_status} /></p></td>
              <td className="px-4 py-3"><SafeguardTestingStatusBadge value={row.testing_status ?? row.testing?.test_status} /></td>
              <td className="px-4 py-3"><SafeguardImpairmentBadge value={row.impairment_status ?? row.testing?.bypass_impairment_status} /></td>
              <td className="px-4 py-3">{row.evidence_status ?? (row.documents?.length ? 'Linked' : 'Missing')}</td>
              <td className="px-4 py-3"><SafeguardCompletenessBadge value={row.completeness_status} score={row.completeness_score} /></td>
              <td className="px-4 py-3"><SafeguardConflictBadge value={row.conflict_status} /></td>
              <td className="px-4 py-3">{row.review_status ?? 'Draft'}</td>
              <td className="px-4 py-3"><div className="flex flex-col gap-1"><MocRequiredBadge value={row.moc_update_required} /><PssrBlockerBadge value={row.pssr_blocker} /><MiReadinessImpactBadge value={row.mi_readiness_impact} /></div></td>
              <td className="px-4 py-3"><div className="flex flex-col gap-1"><Link className="text-primary" href={`/process-safety-information/safeguards/${row.id}`}>View</Link><Link className="text-primary" href={`/process-safety-information/safeguards/${row.id}/edit`}>Edit</Link><Link className="text-primary" href={`/process-safety-information/safeguards/${row.id}`}>History</Link></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
