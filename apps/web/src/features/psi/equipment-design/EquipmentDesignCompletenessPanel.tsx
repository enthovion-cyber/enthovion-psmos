import { DesignBasisCompletenessBadge } from '../shared/DesignBasisCompletenessBadge';
import { PsiCard, PsiEmptyState, PsiProgress } from '../shared/PsiUi';

export function EquipmentDesignCompletenessPanel({ checks }: { checks: Array<Record<string, unknown>> }) {
  if (!checks.length) return <PsiEmptyState title="No completeness results yet" message="Run the backend completeness check to evaluate missing ratings, materials, codes, assumptions, documents, MOC, PSSR, SOL, and MI readiness dependencies." />;
  return (
    <PsiCard title="Completeness Evaluation" subtitle="Backend-generated readiness checks used by PSI, MI, PSSR, MOC, review, and reporting workflows.">
      <div className="space-y-3">
        {checks.map((check) => {
          const score = Number(check.completeness_score ?? check.score ?? 0);
          return (
            <div key={String(check.id ?? check.requirement_key)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{String(check.requirement_label ?? check.requirement_key ?? 'Requirement')}</p>
                <DesignBasisCompletenessBadge value={String(check.status ?? 'Unknown')} score={score} />
              </div>
              <div className="mt-2"><PsiProgress value={score} /></div>
              <p className="mt-2 text-sm text-[var(--psm-muted)]">{String(check.message ?? check.remediation_hint ?? 'No backend message returned.')}</p>
            </div>
          );
        })}
      </div>
    </PsiCard>
  );
}
