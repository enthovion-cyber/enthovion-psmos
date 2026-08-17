import Link from 'next/link';
import type { ProcessChemistry } from '../types/process-chemistry.types';
import { ChemistryCompletenessBadge } from '../shared/ChemistryCompletenessBadge';
import { ChemistryTypeBadge } from '../shared/ChemistryTypeBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { ReactionHazardBadge } from '../shared/ReactionHazardBadge';
import { RunawayPotentialBadge } from '../shared/RunawayPotentialBadge';

export function ProcessChemistryTable({ rows }: { rows: ProcessChemistry[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {['Chemistry', 'Type', 'Operating mode', 'Hazard', 'Runaway', 'Completeness', 'MOC', 'PSSR', 'Review', 'Actions'].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3"><Link className="font-semibold text-primary hover:underline" href={`/process-safety-information/process-chemistry/${row.id}`}>{row.chemistry_name}</Link><p className="mt-1 max-w-xs text-xs text-[var(--psm-muted)]">{row.process_step ?? row.main_reaction_equation ?? 'No equation recorded'}</p></td>
              <td className="px-4 py-3"><ChemistryTypeBadge value={row.chemistry_type} /></td>
              <td className="px-4 py-3">{row.operating_mode ?? 'Not set'}</td>
              <td className="px-4 py-3"><ReactionHazardBadge value={row.hazard_level} /></td>
              <td className="px-4 py-3"><RunawayPotentialBadge value={row.runaway_potential} /></td>
              <td className="px-4 py-3"><ChemistryCompletenessBadge status={row.completeness_status} score={row.completeness_score} /></td>
              <td className="px-4 py-3"><MocRequiredBadge value={row.moc_update_required} /></td>
              <td className="px-4 py-3"><PssrBlockerBadge value={row.pssr_blocker} /></td>
              <td className="px-4 py-3">{row.review_status ?? 'Not Reviewed'}</td>
              <td className="px-4 py-3"><Link className="text-primary hover:underline" href={`/process-safety-information/process-chemistry/${row.id}/edit`}>Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
