'use client';

import { useQuery } from '@tanstack/react-query';
import { psiLinkedRecordService } from '../services/psi-linked-record.service';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiChangeHistoryTab } from '../units/tabs/PsiChangeHistoryTab';

export function PsiHistoryPage() {
  const query = useQuery({ queryKey: ['psi', 'history'], queryFn: () => psiLinkedRecordService.history() });
  if (query.isLoading) return <PsiLoadingState rows={5} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  return <PsiChangeHistoryTab rows={query.data?.rows ?? []} />;
}
