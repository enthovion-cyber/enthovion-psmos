'use client';

import { usePsiUnitDetail } from '../hooks/usePsiUnitDetail';
import { usePsiUnitMutations } from '../hooks/usePsiUnitMutations';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiUnitDetailHeader } from './PsiUnitDetailHeader';
import { PsiCompletenessTab } from './tabs/PsiCompletenessTab';
import { PsiDocumentsTab } from './tabs/PsiDocumentsTab';
import { PsiLinkedRecordsTab } from './tabs/PsiLinkedRecordsTab';
import { PsiProfileTab } from './tabs/PsiProfileTab';
import { PsiUnitOverviewTab } from './tabs/PsiUnitOverviewTab';
import { PsiChangeHistoryTab } from './tabs/PsiChangeHistoryTab';

export function PsiUnitDetailPage({ unitId, tab = 'overview' }: { unitId: string; tab?: 'overview' | 'profile' | 'completeness' | 'linked-records' | 'documents' | 'history' }) {
  const query = usePsiUnitDetail(unitId);
  const mutations = usePsiUnitMutations(unitId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const detail = query.data;
  const content = tab === 'profile'
    ? <PsiProfileTab detail={detail} />
    : tab === 'completeness'
      ? <PsiCompletenessTab detail={detail} onRun={() => mutations.runCompleteness.mutate()} isRunning={mutations.runCompleteness.isPending} />
      : tab === 'linked-records'
        ? <PsiLinkedRecordsTab detail={detail} />
        : tab === 'documents'
          ? <PsiDocumentsTab detail={detail} />
          : tab === 'history'
            ? <PsiChangeHistoryTab rows={detail.history} />
            : <PsiUnitOverviewTab detail={detail} />;
  return (
    <div className="space-y-5">
      <PsiUnitDetailHeader unit={detail.unit} onRunCompleteness={() => mutations.runCompleteness.mutate()} onSubmitReview={() => mutations.submitReview.mutate({})} isBusy={mutations.runCompleteness.isPending || mutations.submitReview.isPending} />
      {content}
    </div>
  );
}
