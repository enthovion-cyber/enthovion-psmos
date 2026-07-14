'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PTWRegisterFilters } from '../../services/ptw-dashboard.service';
import { usePTWDashboard, usePTWDashboardActions } from '../../hooks/usePTWDashboard';
import { usePTWRegister } from '../../hooks/usePTWRegister';
import { usePTWPreview } from '../../hooks/usePTWPreview';
import { usePTWDashboardStore } from '../../stores/ptw-dashboard.store';
import { ConflictPanel } from './ConflictPanel';
import { ExpiringPermitsPanel } from './ExpiringPermitsPanel';
import { GasRetestPanel } from './GasRetestPanel';
import { HandoverPanel } from './HandoverPanel';
import { IsolationPanel } from './IsolationPanel';
import { PermitAreaOverview } from './PermitAreaOverview';
import { PermitRegisterFilters } from './PermitRegisterFilters';
import { PermitRegisterPanel } from './PermitRegisterPanel';
import { PTWAlertFeed } from './PTWAlertFeed';
import { PTWHeader } from './PTWHeader';
import { PTWKpiCards } from './PTWKpiCards';
import { PTWQuickActions } from './PTWQuickActions';
import { SafetyCriticalPanel } from './SafetyCriticalPanel';
import { SelectedPermitPreview } from './SelectedPermitPreview';

export function PTWDashboardPage() {
  const searchParams = useSearchParams();
  const { filters, selectedPermitId, setFilters, resetFilters, applyKpiFilter, setSelectedPermitId } = usePTWDashboardStore();
  const dashboard = usePTWDashboard();
  const register = usePTWRegister(filters);
  const dashboardPermits = dashboard.data?.register?.permits ?? dashboard.data?.activePermits ?? [];
  const dashboardById = new Map(dashboardPermits.map((permit) => [permit.id, permit]));
  const permits = (register.data ?? dashboardPermits).map((permit) => ({ ...dashboardById.get(permit.id), ...permit }));
  const selectedId = selectedPermitId ?? permits[0]?.id ?? null;
  const preview = usePTWPreview(selectedId);
  const actions = usePTWDashboardActions();

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries()) as Partial<PTWRegisterFilters>;
    if (Object.keys(params).length) setFilters(params);
  }, [searchParams, setFilters]);

  useEffect(() => {
    if (!selectedPermitId && permits[0]?.id) setSelectedPermitId(permits[0].id);
  }, [permits, selectedPermitId, setSelectedPermitId]);

  const refresh = () => {
    dashboard.refetch();
    register.refetch();
  };

  return (
    <div className="-m-4 min-h-[calc(100vh-72px)] overflow-x-hidden bg-[#050b14] text-slate-100 antialiased selection:bg-blue-500/30 md:-m-6">
      <main className="min-w-0 bg-[radial-gradient(circle_at_top_left,rgba(20,80,150,0.15),transparent_40%),linear-gradient(180deg,#071220,#050b14)] p-3 sm:p-4 lg:p-6">
        
        {/* 1. Header Layout */}
        <PTWHeader 
          dashboard={dashboard.data} 
          refreshing={dashboard.isFetching || register.isFetching} 
          onRefresh={refresh} 
          onExport={() => actions.exportCsv.mutate()} 
        />
        
        {/* 2. KPI Cards Layout */}
        <div className="mt-4">
          <PTWKpiCards dashboard={dashboard.data} loading={dashboard.isLoading} onFilter={applyKpiFilter} />
        </div>

        {/* Global Error Banner */}
        {(dashboard.isError || register.isError) && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
            <span className="font-semibold">System Alert:</span> Unable to load live PTW dashboard data.
          </div>
        )}

        {/* 3. Filter Toolbar Layout */}
        <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-900/30 p-1 backdrop-blur-md shadow-lg shadow-black/10">
          <PermitRegisterFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
        </div>

        {/* 4. Main Flex Container: 20% | 60% | 20% Distribution */}
        <div className="mt-4 flex flex-col gap-4 lg:flex-row items-start justify-between w-full">
          
          {/* TRACK A: Left Sidebar - Permit Register Ledger (20% Width / Sticky) */}
          <div className="w-full min-w-0 lg:w-[20%] lg:sticky lg:top-4 overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/20 shadow-xl shadow-black/20 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
            <PermitRegisterPanel 
              permits={permits} 
              selectedId={selectedId} 
              loading={register.isLoading} 
              onSelect={setSelectedPermitId} 
              page={Number(filters.page ?? 1)} 
              onPage={(page) => setFilters({ page: String(page) })} 
            />
          </div>

          {/* TRACK B: Center Column - Core Focus Workspace (60% Width / Sticky) */}
          <div className="w-full min-w-0 lg:w-[60%] lg:sticky lg:top-4 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar space-y-4 px-1">
            {/* Primary Inspector Focus */}
            <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/25 shadow-xl shadow-black/20">
              <SelectedPermitPreview permit={preview.data ?? permits.find((permit) => permit.id === selectedId) ?? null} />
            </div>
            
            {/* Isolation Status & Safety Critical Work Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800/40 bg-slate-900/20 p-0.5 hover:border-slate-700/40 transition-colors">
                <IsolationPanel data={dashboard.data?.panels?.isolation} />
              </div>
              <div className="rounded-xl border border-slate-800/40 bg-slate-900/20 p-0.5 hover:border-slate-700/40 transition-colors">
                <SafetyCriticalPanel data={dashboard.data?.panels?.safetyCritical} />
              </div>
            </div>

            {/* Expiring Permits, Conflicts & SIMOPS Diagnostics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
                <ExpiringPermitsPanel data={dashboard.data?.panels?.expiring} />
              </div>
              <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
                <ConflictPanel data={dashboard.data?.panels?.conflicts} />
              </div>
            </div>

            {/* Shift Handover Tracker & Live Alert Feed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
                <HandoverPanel data={dashboard.data?.panels?.handover} />
              </div>
              <div className="rounded-xl border border-slate-800/40 bg-slate-900/20 p-0.5">
                <PTWAlertFeed alerts={dashboard.data?.alerts} />
              </div>
            </div>
          </div>

          {/* TRACK C: Right Sidebar - Control Room Diagnostics (20% Width / Sticky) */}
          <div className="w-full min-w-0 lg:w-[20%] lg:sticky lg:top-4 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar space-y-4">
            {/* Control Room Permit Map (Area Overview) */}
            <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
              <PermitAreaOverview areaOverview={dashboard.data?.areaOverview} />
            </div>

            {/* Quick Actions Engine Hook */}
            <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 shadow-md">
              <PTWQuickActions 
                onRunConflictScan={() => actions.runConflictScan.mutate()} 
                onExport={() => actions.exportCsv.mutate()} 
                running={actions.runConflictScan.isPending} 
              />
            </div>

            {/* Gas Status / Atmosphere Retest Tracker */}
            <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 shadow-md">
              <GasRetestPanel data={dashboard.data?.panels?.gasRetest} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}