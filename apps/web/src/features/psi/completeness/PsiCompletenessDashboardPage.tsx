'use client';

import { useState } from 'react';
import { usePsiCompletenessDashboard } from '../hooks/usePsiCompletenessDashboard';
import { usePsiCompletenessRunMutation } from '../hooks/usePsiCompletenessRuns';
import { usePsiCompletenessScores } from '../hooks/usePsiCompletenessScores';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessByModuleChart } from './PsiCompletenessByModuleChart';
import { PsiCompletenessByUnitTable } from './PsiCompletenessByUnitTable';
import { PsiCompletenessFilters } from './PsiCompletenessFilters';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';
import { PsiCompletenessSummaryCards } from './PsiCompletenessSummaryCards';
import { PsiScoreBreakdownPanel } from './PsiScoreBreakdownPanel';

export function PsiCompletenessDashboardPage() {
  const [search, setSearch] = useState('');
  const dashboard = usePsiCompletenessDashboard(search ? { search } : {});
  const scores = usePsiCompletenessScores();
  const run = usePsiCompletenessRunMutation();
  if (dashboard.isLoading) return <PsiLoadingState rows={6} />;
  if (dashboard.isError) return <PsiErrorState message="The PSI completeness dashboard could not be loaded." onRetry={() => dashboard.refetch()} />;
  const data = dashboard.data;
  if (!data) return null;
  return (
    <div className="space-y-5">
      <PsiCompletenessHeader onRun={() => run.mutate({ run_scope: 'Site' })} isRunning={run.isPending} />
      <PsiCompletenessFilters search={search} onSearch={setSearch} />
      <PsiCompletenessSummaryCards dashboard={data} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PsiCompletenessByModuleChart rows={data.charts?.byModule ?? []} />
        <PsiScoreBreakdownPanel scores={scores.data ?? []} />
      </div>
      <PsiCompletenessByUnitTable rows={data.topIncompleteUnits ?? data.charts?.byUnit ?? []} />
      <div className="flex flex-wrap gap-2">
        <PsiButton href="/process-safety-information/completeness/requirements" variant="secondary">Requirement Registry</PsiButton>
        <PsiButton href="/process-safety-information/completeness/run-history" variant="secondary">Run History</PsiButton>
        <PsiButton href="/process-safety-information/completeness/waivers" variant="secondary">Waivers</PsiButton>
        <PsiButton href="/process-safety-information/completeness/settings" variant="secondary">Settings</PsiButton>
      </div>
    </div>
  );
}
