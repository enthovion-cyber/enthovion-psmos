import Link from 'next/link';
import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCompletenessBadge } from '../shared/PsiCompletenessBadge';
import { PsiCriticalGapBadge } from '../shared/PsiCriticalGapBadge';
import { PsiReviewStatusBadge } from '../shared/PsiReviewStatusBadge';
import { PsiStatusBadge } from '../shared/PsiStatusBadge';

export function PsiUnitTable({ rows = [] }: { rows?: PsiUnit[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {['Unit Code', 'Unit Name', 'Site / Area', 'Unit Type', 'Process Description', 'Major Hazards', 'PSI Completeness', 'Critical Gaps', 'PSI Status', 'Review Status', 'Owner', 'Last Review', 'Next Review Due', 'MOC Update Required', 'PSSR Blocker', 'Actions'].map((header) => <th key={header} className="px-3 py-3">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((unit) => (
            <tr key={unit.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-3 py-3 font-semibold">{unit.unit_code}</td>
              <td className="px-3 py-3">{unit.unit_name}</td>
              <td className="px-3 py-3">{unit.site?.name ?? unit.site_id}{unit.area ? ` / ${unit.area.name}` : ''}</td>
              <td className="px-3 py-3">{unit.unit_type}</td>
              <td className="max-w-xs px-3 py-3 text-[var(--psm-muted)]">{unit.process_purpose ?? unit.description ?? 'Missing process description'}</td>
              <td className="max-w-xs px-3 py-3 text-[var(--psm-muted)]">{unit.major_process_hazards ?? unit.major_chemical_hazards ?? 'Missing hazard summary'}</td>
              <td className="px-3 py-3"><PsiCompletenessBadge status={unit.completeness_status} score={Number(unit.completeness_score ?? 0)} /></td>
              <td className="px-3 py-3"><PsiCriticalGapBadge count={unit.critical_gap_count} blocker={unit.pssr_blocker} /></td>
              <td className="px-3 py-3"><PsiStatusBadge status={unit.psi_status} /></td>
              <td className="px-3 py-3"><PsiReviewStatusBadge status={unit.review_status} /></td>
              <td className="px-3 py-3">{unit.owner?.displayName ?? unit.psi_owner_id ?? 'Unassigned'}</td>
              <td className="px-3 py-3">{unit.last_review_date ?? 'Not reviewed'}</td>
              <td className="px-3 py-3">{unit.next_review_due ?? 'Not set'}</td>
              <td className="px-3 py-3">{unit.moc_update_required ? 'Yes' : 'No'}</td>
              <td className="px-3 py-3">{unit.pssr_blocker ? 'Yes' : 'No'}</td>
              <td className="px-3 py-3">
                <div className="flex flex-col gap-1">
                  <Link className="font-semibold text-primary" href={`/process-safety-information/units/${unit.id}`}>View</Link>
                  <Link className="font-semibold text-primary" href={`/process-safety-information/units/${unit.id}/edit`}>Edit</Link>
                  <Link className="font-semibold text-primary" href={`/process-safety-information/units/${unit.id}/completeness`}>Run Completeness</Link>
                  <Link className="font-semibold text-primary" href={`/process-safety-information/units/${unit.id}/documents`}>Link Documents</Link>
                  <Link className="font-semibold text-primary" href={`/process-safety-information/units/${unit.id}/change-history`}>View History</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
