'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorState, LoadingState } from '../pssr-ui';
import { pssrService } from '../../services/pssr.service';
import { pssrDashboardService } from '../../services/pssr-dashboard.service';
import { usePSSRDashboard } from '../../hooks/usePSSRDashboard';
import { usePSSRDashboardStore } from '../../stores/pssr-dashboard.store';
import { useMutationToast } from '@/providers/ToastProvider';
import { PSSRDashboardHeader } from './PSSRDashboardHeader';
import { PSSRKpiCards } from './PSSRKpiCards';
import { PSSRRegisterFilters } from './PSSRRegisterFilters';
import { PSSRReadinessOverview } from './PSSRReadinessOverview';
import { PSSRRegisterTable } from './PSSRRegisterTable';
import { PSSRStartupSchedulePanel } from './PSSRStartupSchedulePanel';
import { PSSRBlockersHealthPanel } from './PSSRBlockersHealthPanel';
import { PSSRPunchHealthPanel } from './PSSRPunchHealthPanel';
import { PSSRAuthorizationQueuePanel } from './PSSRAuthorizationQueuePanel';
import { PSSRLinkedMOCPanel } from './PSSRLinkedMOCPanel';
import { PSSRRecentActivityFeed } from './PSSRRecentActivityFeed';
import { PSSRQuickActions } from './PSSRQuickActions';

export function PSSRDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useMutationToast();
  
  const { filters, visibleColumns, setFilter, setFilters, resetFilters, setPage, setSort, toggleColumn } = usePSSRDashboardStore();
  const dashboard = usePSSRDashboard(filters);
  
  const readinessMutation = useMutation({
    mutationFn: (id: string) => pssrService.readinessCheck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pssr'] });
      toast.success('Readiness check completed', 'Dashboard data has been refreshed.');
    },
    onError: (error) => toast.error('Readiness check failed', error instanceof Error ? error.message : 'Request failed')
  });
  
  const exportMutation = useMutation({
    mutationFn: () => pssrDashboardService.exportCsv(filters),
    onSuccess: (file) => {
      const blob = new Blob([file.content], { type: file.mimeType ?? 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName ?? 'pssr-dashboard.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PSSR register exported');
    },
    onError: (error) => toast.error('Export failed', error instanceof Error ? error.message : 'Request failed')
  });

  const data = dashboard.data;
  
  const applyPanelFilter = (filter: Record<string, any>) => {
    if (!Object.keys(filter).length) resetFilters();
    else setFilters(filter);
  };

  return (
    <main className="relative min-h-screen bg-[#080d1a] text-slate-100 antialiased selection:bg-blue-500/30 selection:text-white">
      {/* Premium Ambient Lighting Background Effects */}
      <div className="pointer-events-none absolute left-0 top-0 h-[700px] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-indigo-900/5 to-transparent"></div>
      <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px]"></div>

      <div className="relative mx-auto flex max-w-[2200px] flex-col gap-4 p-4 sm:p-5 lg:p-6 lg:gap-6">
        
        {/* Header Section */}
        <PSSRDashboardHeader 
          generatedAt={data?.generatedAt} 
          onRefresh={() => dashboard.refetch()} 
          onExport={() => exportMutation.mutate()} 
          refreshing={dashboard.isFetching} 
        />
        
        {/* Conditional States Container */}
        {dashboard.isLoading ? (
          <div className="mt-20 flex min-h-[400px] items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-sm">
            <LoadingState />
          </div>
        ) : dashboard.isError ? (
          <div className="mt-20 flex min-h-[400px] items-center justify-center rounded-xl border border-red-950/40 bg-red-950/10 p-6 text-center backdrop-blur-sm">
            <ErrorState message="Unable to load PSSR dashboard from API. Please verify network connectivity." />
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
            
            {/* Context & Performance Metrics Row */}
            <PSSRKpiCards kpis={data?.kpis ?? []} onFilter={applyPanelFilter} />
            
            {/* Filter controls Toolbar */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-1 backdrop-blur-md shadow-lg shadow-black/20">
              <PSSRRegisterFilters 
                filters={filters} 
                quickTabs={data?.quickTabs ?? []} 
                onFilter={setFilter} 
                onReset={resetFilters} 
              />
            </div>

            {/* Main Primary View: Full Width Register Data Table */}
            <div className="w-full overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md shadow-xl shadow-black/30">
              <PSSRRegisterTable 
                register={data?.register} 
                visibleColumns={visibleColumns} 
                onPage={setPage} 
                onSort={setSort} 
                onToggleColumn={toggleColumn} 
                onReadinessCheck={(id) => readinessMutation.mutate(id)} 
              />
            </div>
            
            {/* Split Content Architecture Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(340px,1fr)] 2xl:grid-cols-[minmax(0,3fr)_minmax(380px,1fr)] items-start">
              
              {/* Left Main Stream Track: Analytical Overviews & Diagnostic Panels */}
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-6">
                
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-sm">
                  <PSSRReadinessOverview overview={data?.readinessOverview} />
                </div>

                {/* Grid for the 4 Diagnostic Panels: Scales gracefully from 1 to 2 columns */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
                  <div className="rounded-xl border border-slate-800/40 bg-slate-900/25 p-0.5 hover:border-slate-700/40 transition-colors duration-200">
                    <PSSRBlockersHealthPanel rows={data?.blockersHealth ?? []} />
                  </div>
                  
                  <div className="rounded-xl border border-slate-800/40 bg-slate-900/25 p-0.5 hover:border-slate-700/40 transition-colors duration-200">
                    <PSSRPunchHealthPanel punch={data?.punchHealth} />
                  </div>
                  
                  <div className="rounded-xl border border-slate-800/40 bg-slate-900/25 p-0.5 hover:border-slate-700/40 transition-colors duration-200">
                    <PSSRAuthorizationQueuePanel rows={data?.authorizationQueue ?? []} />
                  </div>
                  
                  <div className="rounded-xl border border-slate-800/40 bg-slate-900/25 p-0.5 hover:border-slate-700/40 transition-colors duration-200">
                    <PSSRLinkedMOCPanel rows={data?.linkedMocs ?? []} />
                  </div>
                </div>
                
              </div>
              
              {/* Right Context Rail: Side-Actions, Calendars, & Real-Time Audits */}
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-6">
                
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 shadow-md">
                  <PSSRQuickActions 
                    onRefresh={() => dashboard.refetch()} 
                    onExport={() => exportMutation.mutate()} 
                    onFilter={applyPanelFilter} 
                  />
                </div>
              
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
                  <PSSRStartupSchedulePanel rows={data?.startupSchedule ?? []} />
                </div>

                <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
                  <PSSRRecentActivityFeed rows={data?.recentActivity ?? []} />
                </div>

              </div>
              
            </div>
          </div>
        )}
      </div>
    </main>
  );
}