'use client';

import { EquipmentDesignForm } from './EquipmentDesignForm';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { useEquipmentDesignDetail } from '../hooks/useEquipmentDesignDetail';

export function EquipmentDesignFormPage({ designBasisId, unitId }: { designBasisId?: string | undefined; unitId?: string | undefined }) {
  const detail = useEquipmentDesignDetail(designBasisId ?? '');
  if (designBasisId && detail.isLoading) return <PsiLoadingState rows={8} />;
  if (designBasisId && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  return <EquipmentDesignForm initial={detail.data} designBasisId={designBasisId} forcedUnitId={unitId} />;
}
