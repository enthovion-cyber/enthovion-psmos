'use client';

import { usePsiCompletenessMatrix } from '../hooks/usePsiCompletenessMatrix';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';
import { PsiCompletenessMatrixTable } from './PsiCompletenessMatrixTable';

export function PsiCompletenessMatrixPage({ filters = {} }: { filters?: Record<string, unknown> }) {
  const matrix = usePsiCompletenessMatrix(filters);
  if (matrix.isLoading) return <PsiLoadingState rows={5} />;
  if (matrix.isError) return <PsiErrorState message="The completeness matrix could not be loaded." onRetry={() => matrix.refetch()} />;
  return <div className="space-y-5"><PsiCompletenessHeader title="PSI Completeness Matrix" subtitle="Requirement-level evidence, review, document, conflict, MOC, and PSSR status." /><PsiCompletenessMatrixTable rows={matrix.data?.rows ?? []} /></div>;
}
