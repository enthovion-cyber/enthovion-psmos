'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveSitePerformanceHeader } from './ExecutiveSitePerformanceHeader';
import { ExecutivePerformanceSummaryCards } from './ExecutivePerformanceSummaryCards';
import { ExecutiveScopeModuleScorecardGrid } from './ExecutiveScopeModuleScorecardGrid';
import { ExecutiveScopeKpiScorecardTable } from './ExecutiveScopeKpiScorecardTable';
import { ExecutiveScopeCriticalAlertsPanel } from './ExecutiveScopeCriticalAlertsPanel';
import { ExecutiveScopeOverdueActionsPanel } from './ExecutiveScopeOverdueActionsPanel';
import { ExecutiveScopePendingApprovalsPanel } from './ExecutiveScopePendingApprovalsPanel';
import { ExecutiveScopeStaleRecordsPanel } from './ExecutiveScopeStaleRecordsPanel';
import { ExecutiveScopeSourceTracePanel } from './ExecutiveScopeSourceTracePanel';
import { ExecutiveCrossModuleChart } from '../components/charts';
import { CreatePerformanceSnapshotDialog } from './dialogs/CreatePerformanceSnapshotDialog';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

interface Props {
  siteId: string;
  initialTab?: string;
}

export function ExecutiveSitePerformanceDetailPage({ siteId, initialTab = 'overview' }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const client = useQueryClient();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const query = useQuery({
    queryKey: ['executive', 'performance', 'site', siteId],
    queryFn: () => executiveApi.performanceScope('site', siteId),
  });

  const recalc = useMutation({
    mutationFn: () => executiveApi.performanceRecalculate({ siteId }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['executive', 'performance'] }),
  });

  if (query.isLoading) {
    return <div className="h-80 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
        Site performance data could not be loaded or you do not have permission to view site {siteId}.
      </div>
    );
  }

  const scope = query.data;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'modules', label: `Module Scorecards (${scope.moduleScorecards?.length ?? 0})` },
    { id: 'kpis', label: `KPIs (${scope.kpiScorecards?.length ?? 0})` },
    { id: 'critical-alerts', label: `Critical Alerts (${scope.critical_alert_count ?? 0})` },
    { id: 'overdue-actions', label: `Overdue Actions (${scope.overdue_action_count ?? 0})` },
    { id: 'pending-approvals', label: `Approvals (${scope.pending_approval_count ?? 0})` },
    { id: 'stale-records', label: `Stale Records (${scope.stale_record_count ?? 0})` },
    { id: 'source-trace', label: 'Source Trace' },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <ExecutiveSitePerformanceHeader
        scope={scope}
        onRefresh={() => recalc.mutate()}
        onSnapshot={() => setSnapshotOpen(true)}
        refreshing={recalc.isPending}
      />

      <ExecutivePerformanceSummaryCards scope={scope} />

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--psm-line)] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-[var(--psm-primary)] text-white shadow'
                : 'border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <ExecutiveCrossModuleChart moduleScorecards={scope.moduleScorecards} />
          <ExecutiveScopeModuleScorecardGrid
            moduleScorecards={scope.moduleScorecards}
            scopeRecordId={siteId}
            scopeType="site"
          />
        </div>
      )}

      {activeTab === 'modules' && (
        <ExecutiveScopeModuleScorecardGrid
          moduleScorecards={scope.moduleScorecards}
          scopeRecordId={siteId}
          scopeType="site"
        />
      )}

      {activeTab === 'kpis' && (
        <ExecutiveScopeKpiScorecardTable kpiScorecards={scope.kpiScorecards} />
      )}

      {activeTab === 'critical-alerts' && (
        <ExecutiveScopeCriticalAlertsPanel alerts={scope.criticalAlerts ?? []} />
      )}

      {activeTab === 'overdue-actions' && (
        <ExecutiveScopeOverdueActionsPanel actions={scope.overdueActions ?? []} />
      )}

      {activeTab === 'pending-approvals' && (
        <ExecutiveScopePendingApprovalsPanel approvals={scope.pendingApprovals ?? []} />
      )}

      {activeTab === 'stale-records' && (
        <ExecutiveScopeStaleRecordsPanel records={scope.staleRecords ?? []} />
      )}

      {activeTab === 'source-trace' && (
        <ExecutiveScopeSourceTracePanel sourceTrace={scope.sourceTrace ?? []} />
      )}

      <CreatePerformanceSnapshotDialog
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
        defaultScopeType="site"
        defaultScopeId={siteId}
      />
    </main>
  );
}
