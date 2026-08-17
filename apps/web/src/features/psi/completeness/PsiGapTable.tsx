import type { PsiCompletenessGap } from '../types/psi-completeness.types';
import { GapSeverityBadge } from '../components/shared/GapSeverityBadge';
import { GapStatusBadge } from '../components/shared/GapStatusBadge';
import { PsiButton, PsiCard } from '../shared/PsiUi';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';

export function PsiGapTable({ rows = [], onVerify, onResolve, onCreateAction }: { rows?: PsiCompletenessGap[]; onVerify?: (gap: PsiCompletenessGap) => void; onResolve?: (gap: PsiCompletenessGap) => void; onCreateAction?: (gap: PsiCompletenessGap) => void }) {
  return (
    <PsiCard title="PSI Completeness Gaps" subtitle="Backend-generated open gaps, blockers, document gaps, conflicts, review overdue items, and required workflow actions.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr><th className="py-2">Gap</th><th className="py-2">Module</th><th className="py-2">Severity</th><th className="py-2">Status</th><th className="py-2">PSSR</th><th className="py-2">MOC</th><th className="py-2">Due</th><th className="py-2">Actions</th></tr></thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.length ? rows.map((gap) => <tr key={gap.id}><td className="max-w-sm py-3"><p className="font-medium">{gap.gap_title}</p><p className="text-xs text-[var(--psm-muted)]">{gap.reason ?? gap.missing_item}</p></td><td className="py-3">{gap.psi_module}</td><td className="py-3"><GapSeverityBadge severity={gap.gap_severity} /></td><td className="py-3"><GapStatusBadge status={gap.gap_status} /></td><td className="py-3"><PssrBlockerBadge value={Boolean(gap.pssr_blocker)} /></td><td className="py-3"><MocRequiredBadge value={Boolean(gap.moc_required)} /></td><td className="py-3">{gap.due_date ?? 'Not set'}</td><td className="py-3"><div className="flex flex-wrap gap-2"><PsiButton variant="secondary" onClick={() => onCreateAction?.(gap)}>Create Action</PsiButton><PsiButton variant="secondary" onClick={() => onResolve?.(gap)}>Resolve</PsiButton><PsiButton variant="secondary" onClick={() => onVerify?.(gap)} title={!gap.evidence_found ? 'Verification requires evidence or an approved waiver.' : undefined} disabled={!gap.evidence_found && !gap.verified_at}>Verify</PsiButton></div></td></tr>) : <tr><td colSpan={8} className="py-8 text-center text-[var(--psm-muted)]">No gaps match this view.</td></tr>}
          </tbody>
        </table>
      </div>
    </PsiCard>
  );
}
