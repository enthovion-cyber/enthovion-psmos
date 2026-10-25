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
      setExportMessage('CSV export generated from live MOC dashboard API.');
    } catch {
      setExportMessage('Unable to export MOC dashboard CSV.');
    }
  }

  const data = dashboard.data;

  return (
    <div className="space-y-6 w-full text-[var(--psm-fg)] transition-colors">
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
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
          {exportMessage}
        </div>
      )}

      {/* Global Loaders */}
      {dashboard.isLoading && <LoadingState />}
      {dashboard.isError && (
        <ErrorState message="Unable to load MOC dashboard analytics from API. Register stream will still try to load below." />
      )}

      {/* Dynamic Metric Grid Stack */}
      <MOCKpiCards kpis={data?.kpis} />

      {/* SECTION 1: Process Analytics, Bottlenecks and Strategic Risk Mapping */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch w-full">
        <MOCLifecycleHealth items={data?.lifecycleHealth} />
        <MOCRiskOverview data={data?.riskOverview} />
      </section>

      {/* SECTION 2: Master Workflow Matrix and Actions Control Center */}
      <section className="space-y-4 w-full">
        <MOCRegisterFilters />
        <MOCRegisterTable 
          register={register.data ?? data?.register} 
          isLoading={register.isLoading} 
          isError={register.isError} 
        />
      </section>

      {/* SECTION 3: Action Items, Type Distribution and Critical Flags */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch w-full">
        <MOCActionHealthPanel data={data?.actionHealth} />
        <MOCTypeDistribution items={data?.typeDistribution} />
        <MOCCriticalRiskAlert items={data?.riskOverview?.criticalAlerts} />
      </section>

      {/* SECTION 4: Temporary Controls and Time-Critical Containment Trackers */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 items-stretch w-full">
        <MOCTemporaryPanel data={data?.temporary} />
        <MOCEmergencyPanel data={data?.emergency} />
        <div className="md:col-span-2 xl:col-span-1 w-full">
          <MOCTemporaryExpiryTimeline items={data?.temporary?.items} />
        </div>
      </section>

      {/* SECTION 5: Startup Readiness Metrics and Activity Logs */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch w-full">
        <MOCStartupReadinessPanel data={data?.startupReadiness} />
        <MOCRecentActivityFeed items={data?.recentActivity} />
      </section>

      {/* SECTION 6: Quick Actions & Approval Aging */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch w-full">
        <MOCQuickActions />
        <MOCApprovalQueuePanel data={data?.approvalQueue} />
        <MOCApprovalAging data={data?.approvalAging} />
      </section>

      {/* Operations Integration Review Banner */}
      <footer className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={16} />
          <p className="leading-relaxed">
            <strong>OSHA 1910.119 PSM Governance Verified:</strong> MOC register and telemetry are tightly coupled with equipment technical baselines (PSI), multi-discipline workflow approvals, Action Center timing gates (Pre-Startup vs. Post-Startup), training competencies, and hard PSSR sign-off readiness.
          </p>
        </div>
      </footer>

      {/* Global Interactive Context Drawer */}
      <MOCPreviewDrawer />
    </div>
  );
}
