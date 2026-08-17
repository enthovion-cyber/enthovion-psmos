'use client';

import { useMaterialCompatibilityDetail } from '../hooks/useMaterialCompatibilityDetail';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { MaterialCompatibilityForm } from './MaterialCompatibilityForm';

export function MaterialCompatibilityFormPage({ compatibilityId, unitId }: { compatibilityId?: string | undefined; unitId?: string | undefined }) {
  const query = useMaterialCompatibilityDetail(compatibilityId ?? '');
  if (compatibilityId && query.isLoading) return <PsiLoadingState rows={8} />;
  if (compatibilityId && query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  return <MaterialCompatibilityForm initial={query.data} compatibilityId={compatibilityId} forcedUnitId={unitId} />;
}
