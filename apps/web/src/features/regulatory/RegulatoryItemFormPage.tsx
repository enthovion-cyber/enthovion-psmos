'use client';

import { RegulatoryItemForm } from './RegulatoryItemForm';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from './shared/RegulatoryUi';
import { useRegulatoryItem } from './hooks/useRegulatoryItem';

export function RegulatoryItemFormPage({ id }: { id?: string | undefined }) {
  const query = useRegulatoryItem(id);
  if (!id) return <RegulatoryItemForm />;
  if (query.isLoading) return <RegulatoryLayout current="Edit"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Edit"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return query.data?.item ? <RegulatoryItemForm item={query.data.item} /> : <RegulatoryLayout current="Not Found"><RegulatoryErrorState message="Regulatory requirement was not found or is outside your company/site scope." /></RegulatoryLayout>;
}
