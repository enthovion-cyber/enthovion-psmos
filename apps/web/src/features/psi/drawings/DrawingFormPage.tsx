'use client';

import { useDrawingDetail } from '../hooks/useDrawingDetail';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { DrawingForm } from './DrawingForm';

export function DrawingFormPage({ drawingId, unitId }: { drawingId?: string | undefined; unitId?: string | undefined }) {
  const detail = useDrawingDetail(drawingId ?? '');
  if (drawingId && detail.isLoading) return <PsiLoadingState rows={8} />;
  if (drawingId && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  return <DrawingForm initial={detail.data} drawingId={drawingId} forcedUnitId={unitId} />;
}
