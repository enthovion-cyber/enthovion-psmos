'use client';

import { usePsiCompletenessRuns } from '../hooks/usePsiCompletenessRuns';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';
import { PsiRunHistoryTable } from './PsiRunHistoryTable';

export function PsiRunHistoryPage() {
  const runs = usePsiCompletenessRuns();
  if (runs.isLoading) return <PsiLoadingState rows={4} />;
  if (runs.isError) return <PsiErrorState message="Completeness run history could not be loaded." onRetry={() => runs.refetch()} />;
  return <div className="space-y-5"><PsiCompletenessHeader title="Completeness Run History" subtitle="Run, retry, cancel, and audit the PSI completeness engine execution record." /><PsiRunHistoryTable rows={runs.data ?? []} /></div>;
}
