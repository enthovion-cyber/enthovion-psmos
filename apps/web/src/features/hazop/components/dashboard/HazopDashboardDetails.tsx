'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { hazopDashboardService } from '../../services/hazop-dashboard.service';
import { useHazopDashboard, useHazopDashboardExport, useHazopDashboardStudies } from '../../hooks/useHazopDashboard';
import { useHazopDashboardFilters } from '../../hooks/useHazopDashboardFilters';
import { HazopDashboardHeader } from './HazopDashboardHeader';
import { HazopDashboardKpiCards } from './HazopDashboardKpiCards';
import { HazopDashboardFiltersPanel } from './HazopDashboardFilters';
import { HazopStudyRegisterTable } from './HazopStudyRegisterTable';
import { HazopRiskOverviewInfographic } from './HazopRiskOverviewInfographic';
import { HazopStatusDistributionChart } from './HazopStatusDistributionChart';
import { HazopRecommendationHealthPanel } from './HazopRecommendationHealthPanel';
import { HazopRevalidationDuePanel, HazopOverdueStudiesPanel, HazopComplianceWatchPanel } from './HazopRevalidationDuePanel';
import { HazopHighCriticalRiskPanel } from './HazopHighCriticalRiskPanel';
import { HazopLopaRequiredPanel } from './HazopLopaRequiredPanel';
import { HazopTeamSignoffPanel } from './HazopTeamSignoffPanel';
import { HazopRecentActivityTimeline } from './HazopRecentActivityTimeline';
import { HazopTrendCharts } from './HazopTrendCharts';
import { HazopDashboardQuickActions } from './HazopDashboardQuickActions';

interface StudyItem {
  id?: string | number;
  study_number: string;
  title: string;
  study_type: string;
  site_name?: string;
  unit_name?: string;
  area_name?: string;
  study_leader_name?: string;
  status: string;
  risk_priority?: string;
  highRiskCount?: number;
  openRecommendationCount?: number;
  lopaRequiredCount?: number;
  lopa_required?: boolean;
  revalidation_due_date?: string;
  target_completion_date?: string;
  linked_moc_id?: string;
  linked_pssr_id?: string;
}

export function HazopDashboardDetails() {
  const { filters, setFilter, reset, activeCount } = useHazopDashboardFilters();
  const dashboard = useHazopDashboard(filters);
  const studiesQuery = useHazopDashboardStudies(filters);
  const teamSignoff = useQuery({ 
    queryKey: ['hazop', 'dashboard', 'team-signoff'], 
    queryFn: hazopDashboardService.teamSignoff 
  });
  const exportMutation = useHazopDashboardExport();

  const data = dashboard.data ?? {};
  const studies: StudyItem[] = studiesQuery.data ?? data.studies ?? [];
  
  // Memoized layout calculations
  const filteredStudies = useMemo(() => filterStudies(studies, filters), [studies, filters]);
  const overdueStudies = useMemo(() => filteredStudies.filter((study) => isOverdue(study)), [filteredStudies]);
  const lopaStudies = useMemo(() => filteredStudies.filter((study) => Number(study.lopaRequiredCount ?? 0) > 0 || study.lopa_required), [filteredStudies]);
  const kpis = useMemo(() => mergeKpis(data.kpis ?? {}, filteredStudies), [data.kpis, filteredStudies]);

  const doExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (file: any) => {
        if (!file?.content) return;
        const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = file.filename ?? 'hazop-dashboard.csv';
        anchor.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--psm-bg,#0b0f19)] p-4 text-[var(--psm-text,#f8fafc)] lg:p-5 select-none font-sans">
      <div className="mx-auto max-w-[1920px] space-y-4">
        
        {/* Top Control Block: Header & Global State Handlers */}
        <HazopDashboardHeader
          filters={filters}
          onFilter={setFilter}
          onExport={doExport}
          onRefresh={() => {
            void dashboard.refetch();
            void studiesQuery.refetch();
            void teamSignoff.refetch();
          }}
          exporting={exportMutation.isPending}
        />

        {dashboard.isError && <StateBand tone="red" text="Unable to load HAZOP dashboard from API sync endpoint." />}
        {studiesQuery.isError && <StateBand tone="amber" text="Unable to sync the live study register. Cached breakdown matrix remains active." />}
        {dashboard.isLoading && <DashboardSkeleton />}

        {/* Filter Toolbar & Key Performance Metrics Panels */}
        <HazopDashboardFiltersPanel filters={filters} onFilter={setFilter} onReset={reset} activeCount={activeCount} />
        <HazopDashboardKpiCards kpis={kpis} onFilter={(key, value) => setFilter(key as any, value)} />

        {/* ROW 1: Infographics & Distribution Metrics Analytics Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <HazopRiskOverviewInfographic 
            matrix={data.charts?.riskMatrix ?? []} 
            distribution={data.charts?.riskDistribution ?? []} 
          />
          <HazopStatusDistributionChart data={data.charts?.statusDistribution ?? []} />
          <HazopRecommendationHealthPanel health={data.recommendationHealth ?? {}} />
        </div>

        {/* ROW 2: Operational Exception Watchlists (4 equal-height balanced cards) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HazopHighCriticalRiskPanel scenarios={data.highRiskScenarios ?? []} />
          <HazopLopaRequiredPanel studies={lopaStudies} />
          <HazopTeamSignoffPanel signoff={teamSignoff.data ?? { pending: kpis.pendingSignoffs ?? 0, rows: [] }} />
          <HazopComplianceWatchPanel overdueStudies={overdueStudies} revalidationStudies={data.revalidation ?? []} />
        </div>

        {/* ROW 3: Primary Full-Width Data Registry Table Showcase */}
        <div className="w-full min-w-0">
          <HazopStudyRegisterTable studies={filteredStudies} />
        </div>

        {/* ROW 4: Operational Units, Historical Trends & Real-Time Audit Feed */}
        <div className="grid gap-4 xl:grid-cols-[1fr_380px] min-w-0">
          <div className="space-y-4 min-w-0">
            <TopUnitsPanel studies={filteredStudies} />
            <HazopTrendCharts charts={data.charts ?? {}} />
          </div>
          <div className="min-w-0">
            <HazopRecentActivityTimeline events={data.recentActivity ?? []} />
          </div>
        </div>

        {/* Bottom Quick Action Toolbar */}
        <HazopDashboardQuickActions onExport={doExport} onFilter={(key, value) => setFilter(key as any, value)} />
      </div>
    </div>
  );
}

// --- Internal Helper Operations ---

function filterStudies(studies: StudyItem[], filters: any): StudyItem[] {
  const search = String(filters.search ?? '').toLowerCase();
  return studies.filter((study) => {
    if (search && ![study.study_number, study.title, study.study_type, study.site_name, study.unit_name, study.area_name, study.study_leader_name].filter(Boolean).join(' ').toLowerCase().includes(search)) return false;
    if (filters.status && study.status !== filters.status) return false;
    if (filters.studyType && study.study_type !== filters.studyType) return false;
    if (filters.riskPriority && String(study.risk_priority ?? (study.highRiskCount ? 'High' : 'Low')) !== filters.riskPriority) return false;
    if (filters.overdue && !isOverdue(study)) return false;
    if (filters.lopaRequired && !(Number(study.lopaRequiredCount ?? 0) > 0 || study.lopa_required)) return false;
    if (filters.revalidationDue && !study.revalidation_due_date) return false;
    if (filters.dateFrom && study.target_completion_date && study.target_completion_date < filters.dateFrom) return false;
    if (filters.dateTo && study.target_completion_date && study.target_completion_date > filters.dateTo) return false;
    return true;
  });
}

function mergeKpis(api: Record<string, number>, studies: StudyItem[]) {
  return {
    ...api,
    total: studies.length,
    draft: studies.filter((study) => study.status === 'Draft').length,
    // Align mapping with industry state groupings
    inProgress: studies.filter((study) => ['In Preparation', 'In Progress'].includes(study.status)).length,
    pendingApproval: studies.filter((study) => ['In Review', 'Pending Approval'].includes(study.status)).length,
    closed: studies.filter((study) => ['Approved', 'Closed'].includes(study.status)).length,
    overdue: studies.filter(isOverdue).length,
    highRiskOpenScenarios: studies.reduce((sum, study) => sum + Number(study.highRiskCount ?? 0), 0),
    recommendationsOpen: studies.reduce((sum, study) => sum + Number(study.openRecommendationCount ?? 0), 0),
    lopaRequired: studies.reduce((sum, study) => sum + Number(study.lopaRequiredCount ?? 0), 0),
    pendingSignoffs: api.pendingSignoffs ?? 0,
    openActions: api.openActions ?? 0,
    recommendationsOverdue: api.recommendationsOverdue ?? 0,
    revalidationDue: api.revalidationDue ?? studies.filter((study) => study.revalidation_due_date).length,
    mocLinked: api.mocLinked ?? studies.filter((study) => study.linked_moc_id || study.linked_pssr_id).length
  };
}

function isOverdue(study: StudyItem): boolean {
  return Boolean(study.target_completion_date && study.target_completion_date < new Date().toISOString().slice(0, 10) && !['Closed', 'Cancelled', 'Approved'].includes(study.status));
}

// --- Micro UI Layout Sub-Components ---

function TopUnitsPanel({ studies }: { studies: StudyItem[] }) {
  const rows = useMemo(() => {
    const aggregateMap = studies.reduce((map: Record<string, number>, study) => {
      const key = study.unit_name ?? study.area_name ?? study.site_name ?? 'Unassigned';
      map[key] = (map[key] ?? 0) + Number(study.openRecommendationCount ?? 0);
      return map;
    }, {});
    
    return Object.entries(aggregateMap)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 5); // Kept tightly capped at top 5 rows for standard operational layouts
  }, [studies]);

  const max = useMemo(() => Math.max(1, ...rows.map(([, value]) => Number(value))), [rows]);

  return (
    <section className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--psm-text)]">Top Units by Open Recommendations</h3>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {rows.length} units
            </span>
          </div>
          <button className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-2.5">
          {rows.map(([name, value]) => (
            <div key={name} className="group">
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span className="text-[var(--psm-text)] truncate max-w-[200px]">{name}</span>
                <span className="text-[var(--psm-text)] font-bold tracking-wide">{Number(value)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--psm-surface-2)] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out" 
                  style={{ width: `${(Number(value) / max) * 100}%` }} 
                />
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-xs font-medium text-[var(--psm-muted)]">
              No operational recommendation data recorded.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StateBand({ tone, text }: { tone: 'red' | 'amber'; text: string }) {
  const cls = tone === 'red' 
    ? 'border-red-900/50 bg-red-950/20 text-red-200' 
    : 'border-amber-900/50 bg-amber-950/20 text-amber-200';
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium tracking-wide shadow-sm ${cls}`}>
      <AlertTriangle size={14} className={tone === 'red' ? 'text-red-400' : 'text-amber-400'} />
      <span>{text}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div key={idx} className="h-[92px] animate-pulse rounded-xl border border-slate-800/40 bg-[#0f172a]/80" />
      ))}
    </div>
  );
}