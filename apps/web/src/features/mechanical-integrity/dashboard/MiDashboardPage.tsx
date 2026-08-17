'use client';

import { useMiDashboard } from '../hooks/useMiDashboard';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { MiDashboardHeader } from './MiDashboardHeader';
import { MiKpiCards } from './MiKpiCards';
import { MiCriticalAttentionPanel } from './MiCriticalAttentionPanel';
import { MiEquipmentHealthCharts } from './MiEquipmentHealthCharts';
import { MiDueSoonPanel } from './MiDueSoonPanel';
import { MiBypassImpairmentPanel } from './MiBypassImpairmentPanel';
import { MiDeficiencyPanel } from './MiDeficiencyPanel';
import { MiRecentActivity } from './MiRecentActivity';
import { MiQuickActions } from './MiQuickActions';

export function MiDashboardPage() {
  const query = useMiDashboard();
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) {
    return (
      <div className="psm-card p-8">
        <h1 className="text-lg font-semibold text-danger">Mechanical Integrity dashboard unavailable</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">The backend could not load MI dashboard data. Confirm permissions, entitlement, and API availability.</p>
      </div>
    );
  }
  const data = query.data;
  return (
    <div className="space-y-6">
      <MiDashboardHeader header={data.header} onRefresh={() => query.refetch()} />
      <MiKpiCards cards={data.kpis} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <MiCriticalAttentionPanel items={data.criticalAttention} />
        <MiQuickActions />
      </div>
      <MiEquipmentHealthCharts charts={data.charts} />
      <div className="grid gap-5 xl:grid-cols-3">
        <MiDueSoonPanel dueSoon={data.dueSoon} />
        <MiBypassImpairmentPanel items={data.bypasses} />
        <MiDeficiencyPanel items={data.deficiencies} />
      </div>
      <MiRecentActivity items={data.recentActivity} />
    </div>
  );
}
