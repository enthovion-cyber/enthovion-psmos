'use client';

import { useSafeguardDetail } from '../hooks/useSafeguardDetail';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { SafeguardForm } from './SafeguardForm';

export function SafeguardFormPage({ safeguardId, forcedUnitId }: { safeguardId?: string | undefined; forcedUnitId?: string | undefined }) {
  const detail = useSafeguardDetail(safeguardId ?? '');
  if (safeguardId && detail.isLoading) return <PsiLoadingState rows={8} />;
  if (safeguardId && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  return <SafeguardForm initial={detail.data} safeguardId={safeguardId} forcedUnitId={forcedUnitId} />;
}
