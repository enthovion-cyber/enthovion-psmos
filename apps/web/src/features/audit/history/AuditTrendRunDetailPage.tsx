'use client';

import { AuditLayout } from '../AuditLayout';
import { useAuditTrendMutations } from '../hooks/useAuditTrendMutations';
import { useAuditTrendRunDetail } from '../hooks/useAuditTrendRunDetail';
import { AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditTrendRunDetailHeader } from './AuditTrendRunDetailHeader';
import { AuditTrendRecalculateDialog } from './AuditTrendRecalculateDialog';
import { TrendActionsFoundationTab } from './tabs/TrendActionsFoundationTab';
import { TrendExplainabilityTab } from './tabs/TrendExplainabilityTab';
import { TrendHistoryTab } from './tabs/TrendHistoryTab';
import { TrendInputSnapshotTab } from './tabs/TrendInputSnapshotTab';
import { TrendResultsTab } from './tabs/TrendResultsTab';
import { TrendRunOverviewTab } from './tabs/TrendRunOverviewTab';
import { TrendSourceRecordsTab } from './tabs/TrendSourceRecordsTab';

export function AuditTrendRunDetailPage({ trendRunId, activeTab = 'overview' }: { trendRunId: string; activeTab?: string }) {
  const query = useAuditTrendRunDetail(trendRunId);
  const mutations = useAuditTrendMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const detail = query.data;
  if (!detail) return <AuditLayout><AuditErrorState message="Trend run not found." /></AuditLayout>;
  const tab = activeTab === 'input-snapshot' ? <TrendInputSnapshotTab snapshot={detail.inputSnapshot} methodology={detail.methodologySnapshot} /> : activeTab === 'results' ? <TrendResultsTab results={detail.results} /> : activeTab === 'explainability' ? <TrendExplainabilityTab explainability={detail.explainability} trace={detail.calculationTrace} /> : activeTab === 'source-records' ? <TrendSourceRecordsTab rows={detail.sourceRecords} /> : activeTab === 'actions-foundation' ? <TrendActionsFoundationTab rows={detail.actionsFoundation} /> : activeTab === 'history' ? <TrendHistoryTab rows={detail.history} /> : <TrendRunOverviewTab detail={detail} />;
  return <AuditLayout><div className="space-y-5"><AuditTrendRunDetailHeader run={detail.trendRun} activeTab={activeTab} />{tab}<AuditTrendRecalculateDialog saving={mutations.recalculate.isPending} disabled={detail.trendRun.trend_status === 'Archived'} reason="Archived trend runs cannot be recalculated" onRecalculate={() => mutations.recalculate.mutate(detail.trendRun.id)} /></div></AuditLayout>;
}
