import { PsiCard, PsiProgress } from '../shared/PsiUi';

export function PsiCompletenessByModuleChart({ rows = [] }: { rows?: Array<Record<string, any>> }) {
  return (
    <PsiCard title="Completeness by PSI Module" subtitle="Backend-generated score and gap count by module.">
      <div className="space-y-3">
        {rows.length ? rows.map((row) => (
          <div key={row.module} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{row.module}</span>
              <span className="text-[var(--psm-muted)]">{Math.round(Number(row.score ?? 0))}% | {row.gaps ?? 0} gaps</span>
            </div>
            <PsiProgress value={Number(row.score ?? 0)} />
          </div>
        )) : <p className="text-sm text-[var(--psm-muted)]">No module score data has been generated yet. Run the completeness engine.</p>}
      </div>
    </PsiCard>
  );
}
