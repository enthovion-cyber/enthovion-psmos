'use client';

import { useElectricalClassificationDetail } from '../hooks/useElectricalClassificationDetail';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ElectricalClassificationForm } from './ElectricalClassificationForm';

export function ElectricalClassificationFormPage({ classificationId, unitId }: { classificationId?: string | undefined; unitId?: string | undefined }) {
  const detail = useElectricalClassificationDetail(classificationId ?? '');
  if (classificationId && detail.isLoading) return <PsiLoadingState rows={8} />;
  if (classificationId && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  return <ElectricalClassificationForm initial={detail.data} classificationId={classificationId} forcedUnitId={unitId} />;
}
