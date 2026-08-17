'use client';

import { usePsiCompletenessRunMutation } from '../hooks/usePsiCompletenessRuns';
import { PsiButton, PsiCard } from '../shared/PsiUi';

export function PsiCompletenessRunDialog({ input = {} }: { input?: Record<string, unknown> }) {
  const run = usePsiCompletenessRunMutation();
  return <PsiCard title="Run Completeness Engine" subtitle="Evaluates requirements, creates/updates gaps, scores readiness, and writes audit/history events."><PsiButton onClick={() => run.mutate(input)} disabled={run.isPending} title={run.isPending ? 'Completeness run is already in progress.' : undefined}>{run.isPending ? 'Running...' : 'Run Now'}</PsiButton>{run.isSuccess ? <p className="mt-3 text-sm text-success">Completeness run submitted successfully.</p> : null}{run.isError ? <p className="mt-3 text-sm text-danger">Completeness run failed. Check API details and permissions.</p> : null}</PsiCard>;
}
