'use client';

import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from './shared/RegulatoryUi';
import { RegulatoryItemDetailHeader } from './RegulatoryItemDetailHeader';
import { RegulatoryItemTabs } from './RegulatoryItemTabs';
import { useRegulatoryItem, useRegulatoryItemSection } from './hooks/useRegulatoryItem';
import { RegulatoryOverviewTab } from './tabs/RegulatoryOverviewTab';
import { RegulatoryScopeTab } from './tabs/RegulatoryScopeTab';
import { RegulatoryApplicabilityTab } from './tabs/RegulatoryApplicabilityTab';
import { RegulatoryComplianceStatusTab } from './tabs/RegulatoryComplianceStatusTab';
import { RegulatoryFoundationLinksTab } from './tabs/RegulatoryFoundationLinksTab';
import { RegulatoryPhasePlaceholderTab } from './tabs/RegulatoryPhasePlaceholderTab';
import { RegulatoryHistoryTab } from './tabs/RegulatoryHistoryTab';
import { RegulatorySourceActionsTab } from './actions/RegulatorySourceActionsTab';

const titleByTab: Record<string, string> = {
  overview: 'Overview',
  jurisdictions: 'Jurisdictions',
  scope: 'Scope',
  applicability: 'Applicability',
  obligations: 'Obligations Foundation',
  'compliance-status': 'Compliance Status',
  evidence: 'Evidence Links',
  'audit-mapping': 'Audit Mapping',
  actions: 'Action Links',
  review: 'Review Foundation',
  reports: 'Reports Foundation',
  history: 'History'
};

export function RegulatoryItemDetailPage({ id, tab = 'overview' }: { id: string; tab?: string | undefined }) {
  const detailQuery = useRegulatoryItem(id);
  const sectionQuery = useRegulatoryItemSection(id, tab === 'overview' || tab === 'history' ? undefined : tab);
  if (detailQuery.isLoading) return <RegulatoryLayout current={titleByTab[tab] ?? 'Detail'}><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (detailQuery.isError) return <RegulatoryLayout current={titleByTab[tab] ?? 'Detail'}><RegulatoryErrorState message={detailQuery.error} onRetry={() => detailQuery.refetch()} /></RegulatoryLayout>;
  const detail = sectionQuery.data ?? detailQuery.data;
  const item = detailQuery.data?.item;
  if (!item) return <RegulatoryLayout current="Not Found"><RegulatoryErrorState message="Regulatory requirement was not found or is outside your company/site scope." /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current={titleByTab[tab] ?? 'Detail'}>
      <div className="space-y-5">
        <RegulatoryItemDetailHeader item={item} onRefresh={() => { void detailQuery.refetch(); void sectionQuery.refetch(); }} />
        <RegulatoryItemTabs id={id} active={tab} />
        {sectionQuery.isError ? <RegulatoryErrorState message={sectionQuery.error} onRetry={() => sectionQuery.refetch()} /> : null}
        {sectionQuery.isLoading ? <RegulatoryLoadingState rows={4} /> : renderTab(tab, detail, id)}
      </div>
    </RegulatoryLayout>
  );
}

function renderTab(tab: string, detail: ReturnType<typeof useRegulatoryItem>['data'], id: string) {
  if (tab === 'scope') return <RegulatoryScopeTab detail={detail} />;
  if (tab === 'applicability') return <RegulatoryApplicabilityTab detail={detail} />;
  if (tab === 'compliance-status') return <RegulatoryComplianceStatusTab detail={detail} />;
  if (tab === 'evidence') return <RegulatoryFoundationLinksTab detail={detail} module="Evidence" />;
  if (tab === 'audit-mapping') return <RegulatoryFoundationLinksTab detail={detail} module="Audit" />;
  if (tab === 'actions') return <RegulatorySourceActionsTab sourcePath={`/regulatory/${id}/actions`} title="Regulatory Item Actions / CAPA" />;
  if (tab === 'history') return <RegulatoryHistoryTab id={id} />;
  if (tab === 'jurisdictions' || tab === 'obligations' || tab === 'review' || tab === 'reports') return <RegulatoryPhasePlaceholderTab title={titleByTab[tab] ?? 'Foundation Placeholder'} />;
  return <RegulatoryOverviewTab detail={detail} />;
}
