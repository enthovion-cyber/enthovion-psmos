import type { PsiCompletenessMatrixRow } from '../types/psi-completeness.types';
import { CompletenessStatusBadge } from '../components/shared/CompletenessStatusBadge';
import { EvidenceStatusBadge } from '../components/shared/EvidenceStatusBadge';
import { PsiCard } from '../shared/PsiUi';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';

export function PsiCompletenessMatrixTable({ rows = [] }: { rows?: PsiCompletenessMatrixRow[] }) {
  return (
    <PsiCard title="Completeness Matrix" subtitle="Requirement-by-module evaluation with evidence, document, review, conflict, MOC, and PSSR status.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr><th className="py-2">Module</th><th className="py-2">Requirement</th><th className="py-2">Status</th><th className="py-2">Evidence</th><th className="py-2">Document</th><th className="py-2">Review</th><th className="py-2">Conflict</th><th className="py-2">MOC</th><th className="py-2">PSSR</th></tr></thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.length ? rows.map((row) => <tr key={row.id}><td className="py-3">{row.psi_module}</td><td className="py-3 font-medium">{row.requirement_name}</td><td className="py-3"><CompletenessStatusBadge status={row.status ?? row.evaluation_status} /></td><td className="py-3"><EvidenceStatusBadge value={row.evidence?.found} /></td><td className="py-3">{row.documentStatus ?? 'Unknown'}</td><td className="py-3">{row.reviewStatus ?? 'Unknown'}</td><td className="py-3">{row.conflictStatus ?? 'Unknown'}</td><td className="py-3"><MocRequiredBadge value={Boolean(row.mocRequired)} /></td><td className="py-3"><PssrBlockerBadge value={Boolean(row.pssrBlocker)} /></td></tr>) : <tr><td colSpan={9} className="py-8 text-center text-[var(--psm-muted)]">No matrix evaluations have been generated yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </PsiCard>
  );
}
