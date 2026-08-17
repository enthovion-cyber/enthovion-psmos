import type { PsiCompletenessRun } from '../types/psi-completeness.types';
import { PsiCard } from '../shared/PsiUi';

export function PsiRunDetailPanel({ run }: { run?: PsiCompletenessRun | null }) {
  return <PsiCard title="Run Detail" subtitle="The engine stores immutable run evidence for audit review."><pre className="max-h-72 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(run ?? {}, null, 2)}</pre></PsiCard>;
}
