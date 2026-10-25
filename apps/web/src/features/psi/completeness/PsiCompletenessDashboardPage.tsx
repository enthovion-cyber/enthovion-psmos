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
import { LiveEquipmentBaselineTable } from './LiveEquipmentBaselineTable';

export function PsiCompletenessDashboardPage() {
  const [search, setSearch] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const dashboard = usePsiCompletenessDashboard(search ? { search } : {});
  const scores = usePsiCompletenessScores();
  const run = usePsiCompletenessRunMutation();
  if (dashboard.isLoading) return <PsiLoadingState rows={6} />;
  if (dashboard.isError) return <PsiErrorState message="The PSI completeness dashboard could not be loaded." onRetry={() => dashboard.refetch()} />;
  const data = dashboard.data;
  if (!data) return null;

  const units: any[] = data.topIncompleteUnits ?? data.charts?.byUnit ?? [];
  const activeUnit = units.find((u: any) => u.id === selectedUnitId) || units[0];
  const currentUnitId = selectedUnitId || (activeUnit?.id ?? '');

  return (
    <div className="space-y-5">
      <PsiCompletenessHeader onRun={() => run.mutate({ run_scope: 'Site' })} isRunning={run.isPending} />
      <PsiCompletenessFilters search={search} onSearch={setSearch} />
      <PsiCompletenessSummaryCards dashboard={data} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PsiCompletenessByModuleChart rows={data.charts?.byModule ?? []} />
        <PsiScoreBreakdownPanel scores={scores.data ?? []} />
      </div>
      <PsiCompletenessByUnitTable rows={units} />

      {currentUnitId ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--psm-fg)]">Live Asset Baseline & SCE Readiness Matrix</h2>
            {units.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-[var(--psm-muted)]">
                <span>Select Unit:</span>
                <select
                  value={currentUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-sm font-medium text-[var(--psm-fg)] outline-none focus:border-primary"
                >
                  {units.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.unit_code ? `${u.unit_code} - ` : ''}{u.unit_name ?? u.label ?? u.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <LiveEquipmentBaselineTable
            unitId={currentUnitId}
            unitCode={activeUnit?.unit_code}
            unitName={activeUnit?.unit_name ?? activeUnit?.label}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <PsiButton href="/process-safety-information/completeness/requirements" variant="secondary">Requirement Registry</PsiButton>
        <PsiButton href="/process-safety-information/completeness/run-history" variant="secondary">Run History</PsiButton>
        <PsiButton href="/process-safety-information/completeness/waivers" variant="secondary">Waivers</PsiButton>
        <PsiButton href="/process-safety-information/completeness/settings" variant="secondary">Settings</PsiButton>
      </div>
    </div>
  );
}
