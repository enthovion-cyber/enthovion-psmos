'use client';

import { useEffect, useState } from 'react';
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
import { EmergencySuspendModal } from './EmergencySuspendModal';

export function PTWDashboardPage() {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
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
    <div className="-m-4 min-h-[calc(100vh-64px)] bg-slate-50 text-slate-900 dark:bg-[#060d19] dark:text-slate-100 antialiased selection:bg-orange-500/20 dark:selection:bg-blue-500/30 md:-m-6 transition-colors duration-200">
      <main className="min-w-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_40%),linear-gradient(180deg,#f8fafc,#f1f5f9)] dark:bg-[radial-gradient(circle_at_top_left,rgba(20,80,150,0.18),transparent_40%),linear-gradient(180deg,#091424,#060d19)] p-3 sm:p-4 lg:p-4 space-y-3">
        {/* 1. Header Layout */}
        <PTWHeader
          dashboard={dashboard.data}
          refreshing={dashboard.isFetching || register.isFetching}
          onRefresh={refresh}
          onExport={() => actions.exportCsv.mutate()}
          onEmergencySuspend={() => setEmergencyModalOpen(true)}
        />

        {/* 2. KPI Cards Layout */}
        <div className="mt-2">
          <PTWKpiCards dashboard={dashboard.data} loading={dashboard.isLoading} onFilter={applyKpiFilter} />
        </div>

        {/* Global Error Banner */}
        {(dashboard.isError || register.isError) && (
          <div className="rounded-xl border border-rose-300 dark:border-red-500/30 bg-rose-50 dark:bg-red-950/20 px-4 py-3 text-xs sm:text-sm text-rose-800 dark:text-red-200 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="font-bold">System Alert:</span> Live PTW dashboard telemetry offline. Displaying cached operational data.
            </div>
            <button
              onClick={refresh}
              className="text-xs font-bold text-rose-700 dark:text-red-300 hover:underline ml-3"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3. Filter Toolbar Layout */}
        <div>
          <PermitRegisterFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
        </div>

        {/* 4. Unified Workstation: Sticky Left Sidebar + Wide Focus Workspace */}
        <div className="mt-3 flex flex-col lg:flex-row items-start gap-3.5 w-full">
          {/* TRACK A: Left Rail - Sticky Active Permits Register */}
          <aside className="w-full lg:w-[260px] xl:w-[280px] 2xl:w-[300px] shrink-0 lg:sticky lg:top-4 self-start h-[calc(100vh-32px)] flex flex-col">
            <PermitRegisterPanel
              permits={permits}
              selectedId={selectedId}
              loading={register.isLoading}
              onSelect={setSelectedPermitId}
              page={Number(filters.page ?? 1)}
              onPage={(page) => setFilters({ page: String(page) })}
            />
          </aside>

          {/* MAIN WORKSTATION: Unified Focus Workspace */}
          <div className="w-full flex-1 min-w-0 space-y-3.5">
            {/* Primary Inspector Focus Card */}
            <div>
              <SelectedPermitPreview permit={preview.data ?? permits.find((permit) => permit.id === selectedId) ?? null} />
            </div>

            {/* Row 1: Isolation Status & Safety Critical Work Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              <IsolationPanel data={dashboard.data?.panels?.isolation} />
              <SafetyCriticalPanel data={dashboard.data?.panels?.safetyCritical} />
            </div>

            {/* Row 2: Expiring Permits & SIMOPS Conflicts Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              <ExpiringPermitsPanel data={dashboard.data?.panels?.expiring} />
              <ConflictPanel data={dashboard.data?.panels?.conflicts} />
            </div>

            {/* Row 3: Gas Retest Monitoring & Shift Handover Readiness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              <GasRetestPanel data={dashboard.data?.panels?.gasRetest} />
              <HandoverPanel data={dashboard.data?.panels?.handover} />
            </div>

            {/* Row 4: Control Room Map Overview, Quick Actions & Live Alert Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-stretch">
              <PermitAreaOverview areaOverview={dashboard.data?.areaOverview} />
              <PTWQuickActions
                onRunConflictScan={() => actions.runConflictScan.mutate()}
                onExport={() => actions.exportCsv.mutate()}
                running={actions.runConflictScan.isPending}
              />
              <div className="md:col-span-2 xl:col-span-1">
                <PTWAlertFeed alerts={dashboard.data?.alerts} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <EmergencySuspendModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onSuccess={refresh}
        siteId={(filters as any)?.siteId ?? (dashboard.data as any)?.selectedSiteId ?? ''}
      />
    </div>
  );
}
