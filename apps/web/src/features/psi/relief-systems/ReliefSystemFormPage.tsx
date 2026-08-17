'use client';

import { useReliefSystemDetail } from '../hooks/useReliefSystemDetail';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ReliefSystemForm } from './ReliefSystemForm';

export function ReliefSystemFormPage({ reliefBasisId, forcedUnitId }: { reliefBasisId?: string | undefined; forcedUnitId?: string | undefined }) {
  const query = useReliefSystemDetail(reliefBasisId);
  if (reliefBasisId && query.isLoading) return <PsiLoadingState rows={8} />;
  if (reliefBasisId && (query.isError || !query.data)) return <PsiErrorState message={query.error?.message ?? 'Relief system design basis could not be loaded for editing.'} onRetry={() => void query.refetch()} />;
  return <ReliefSystemForm initial={query.data} reliefBasisId={reliefBasisId} forcedUnitId={forcedUnitId} />;
}
