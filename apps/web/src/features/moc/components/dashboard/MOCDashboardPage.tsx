'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { mocDashboardService } from '../../services/moc-dashboard.service';
import { useMOCDashboard } from '../../hooks/useMOCDashboard';
import { useMOCRegister } from '../../hooks/useMOCRegister';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { MOCActionHealthPanel } from './MOCActionHealthPanel';
import { MOCApprovalAging } from './MOCApprovalAging';
import { MOCApprovalQueuePanel } from './MOCApprovalQueuePanel';
import { MOCCriticalRiskAlert } from './MOCCriticalRiskAlert';
import { MOCDashboardHeader } from './MOCDashboardHeader';
import { MOCKpiCards } from './MOCKpiCards';
import { MOCEmergencyPanel } from './MOCEmergencyPanel';
import { MOCLifecycleHealth } from './MOCLifecycleHealth';
import { MOCLiveDataStatus } from './MOCLiveDataStatus';
import { MOCPreviewDrawer } from './MOCPreviewDrawer';
import { MOCQuickActions } from './MOCQuickActions';
import { MOCRecentActivityFeed } from './MOCRecentActivityFeed';
import { MOCRegisterFilters } from './MOCRegisterFilters';
import { MOCRegisterTable } from './MOCRegisterTable';
import { MOCRiskOverview } from './MOCRiskOverview';
import { MOCStartupReadinessPanel } from './MOCStartupReadinessPanel';
import { MOCTemporaryPanel } from './MOCTemporaryPanel';
import { MOCTemporaryExpiryTimeline } from './MOCTemporaryExpiryTimeline';
import { MOCTypeDistribution } from './MOCTypeDistribution';

export function MOCDashboardPage() {
  const filters = useMOCDashboardStore((state) => state.filters);
  const dashboard = useMOCDashboard();
  const register = useMOCRegister();
  const [exportMessage, setExportMessage] = useState('');

  async function exportCsv() {
    setExportMessage('');
    try {
      const payload = await mocDashboardService.exportCsv(filters);
      const csv = typeof payload === 'string' ? payload : payload?.csv ?? JSON.stringify(payload, null, 2);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moc-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMessage('CSV export generated from the live MOC dashboard API.');
    } catch {
      setExportMessage('Unable to export MOC dashboard CSV.');
    }
  }

  const data = dashboard.data;

  return (
    <main className="min-h-screen w-full bg-[#020b16] text-slate-100 p-3 sm:p-5 md:p-6 antialiased selection:bg-slate-800">
      <div className="mx-auto max-w-[1740px] space-y-5">
        
        {/* Header and Live Monitoring Panels */}
        <MOCDashboardHeader 
          generatedAt={data?.generatedAt} 
          onRefresh={() => { dashboard.refetch(); register.refetch(); }} 
          onExport={exportCsv} 
        />
        
        <MOCLiveDataStatus 
          generatedAt={data?.generatedAt} 
          realtime={data?.realtime} 
          onRefresh={() => { dashboard.refetch(); register.refetch(); }} 
        />
        
        {exportMessage && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-semibold text-blue-200 shadow-sm transition-all animate-in fade-in-50">
            {exportMessage}
          </div>
        )}

        {/* Global Pipeline Loaders */}
        {dashboard.isLoading && <LoadingState />}
        {dashboard.isError && (
          <ErrorState message="Unable to load MOC dashboard from API. Register data will still try to load below." />
        )}

        {/* Dynamic Metric Grid Stack */}
        <MOCKpiCards kpis={data?.kpis} />
        
        {/* Pipeline Filtering Controls */}
        <MOCRegisterFilters />

        {/* SECTION 1: Master Workflow Matrix and Actions Control Center */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3 items-start w-full">
          <div className="xl:col-span-2 w-full overflow-hidden">
            <MOCRegisterTable 
              register={register.data ?? data?.register} 
              isLoading={register.isLoading} 
              isError={register.isError} 
            />
          </div>
          <div className="flex flex-col gap-5 h-full justify-start w-full">
            <MOCQuickActions />
            <MOCApprovalQueuePanel data={data?.approvalQueue} />
            <MOCApprovalAging data={data?.approvalAging} />
          </div>
        </section>

        {/* SECTION 2: Process Analytics, Bottlenecks and Strategic Risk Mapping */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-stretch w-full">
          <MOCLifecycleHealth items={data?.lifecycleHealth} />
          <MOCRiskOverview data={data?.riskOverview} />
        </section>

        {/* SECTION 3: Action Items, Type Distribution and Critical Flags */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 items-stretch w-full">
          <div className="md:col-span-2 lg:col-span-1 w-full">
            <MOCActionHealthPanel data={data?.actionHealth} />
          </div>
          <MOCTypeDistribution items={data?.typeDistribution} />
          <MOCCriticalRiskAlert items={data?.riskOverview?.criticalAlerts} />
        </section>

        {/* SECTION 4: Temporary Controls and Time-Critical Containment Trackers */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 items-stretch w-full">
          <MOCTemporaryPanel data={data?.temporary} />
          <MOCEmergencyPanel data={data?.emergency} />
          <div className="md:col-span-2 xl:col-span-1 w-full">
            <MOCTemporaryExpiryTimeline items={data?.temporary?.items} />
          </div>
        </section>

        {/* SECTION 5: Startup Readiness Metrics and Activity Logs */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-stretch w-full">
          <MOCStartupReadinessPanel data={data?.startupReadiness} />
          <MOCRecentActivityFeed items={data?.recentActivity} />
        </section>

        {/* Operations Integration Review Banner */}
        <footer className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-4 text-xs md:text-sm text-amber-200/90 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={18} />
            <p>
              <span className="font-extrabold text-white">Final MOC integration review:</span> dashboard widgets are fed by MOC records, workflow approvals, temporary and emergency control tables, required actions, PSSR readiness, training, attachments/history, and site-scoped IAM permissions. Missing optional tables are handled defensively by the API so incomplete migrations do not break the dashboard shell.
            </p>
          </div>
        </footer>
      </div>

      {/* Global Interactive Context Drawer */}
      <MOCPreviewDrawer />
    </main>
  );
}