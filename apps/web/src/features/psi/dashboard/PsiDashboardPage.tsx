'use client';

import { usePsiDashboard } from '../hooks/usePsiDashboard';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiUnitTable } from '../units/PsiUnitTable';
import { MissingCriticalPsiPanel } from './MissingCriticalPsiPanel';
import { MocUpdateRequiredPanel } from './MocUpdateRequiredPanel';
import { PsiCompletenessPanel } from './PsiCompletenessPanel';
import { PsiHeader } from './PsiHeader';
import { PsiSummaryCards } from './PsiSummaryCards';
import { PssrBlockerPanel } from './PssrBlockerPanel';
import { ReviewOverduePanel } from './ReviewOverduePanel';

export function PsiDashboardPage() {
  const query = usePsiDashboard({
    page: 1,
    limit: 10,
    sort: 'updated_at.desc',
  });

  if (query.isLoading) {
    return <PsiLoadingState rows={8} />;
  }

  if (query.isError) {
    return (
      <PsiErrorState
        message={query.error?.message ?? 'Failed to load PSI dashboard.'}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;

  return (
    <div className="space-y-5">
      <PsiHeader
        lastUpdated={data?.header?.lastUpdated}
        canCreate={Boolean(data?.header?.canCreate)}
        onRefresh={() => void query.refetch()}
      />

      <PsiSummaryCards summary={data?.summary} />

      <div className="grid gap-5 xl:grid-cols-3">
        <PsiCompletenessPanel panel={data?.completenessPanel} />

        <MissingCriticalPsiPanel
          rows={data?.missingCritical ?? []}
        />

        <ReviewOverduePanel
          rows={data?.reviewOverdue ?? []}
        />

        <MocUpdateRequiredPanel
          rows={data?.mocUpdatesRequired ?? []}
        />

        <PssrBlockerPanel
          rows={data?.pssrBlockers ?? []}
        />

        <div className="xl:col-span-3">
          <PsiUnitTable rows={data?.registry?.rows ?? []} />
        </div>
      </div>
    </div>
  );
}