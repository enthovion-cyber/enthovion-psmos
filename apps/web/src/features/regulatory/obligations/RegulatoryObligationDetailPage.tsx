'use client';

import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { RegulatoryCriticalityBadge } from '../shared/RegulatoryCriticalityBadge';
import { RegulatoryComplianceStatusBadge } from '../shared/RegulatoryComplianceStatusBadge';
import { RegulatoryObligationApplicabilityBadge, RegulatoryObligationEvidenceBadge, RegulatoryObligationMappingBadge, RegulatoryObligationStaleBadge, RegulatoryObligationStatusBadge } from '../shared/RegulatoryObligationBadges';
import { useRegulatoryObligation, useRegulatoryObligationSection } from '../hooks/useRegulatoryObligations';
import { RegulatoryObligationDetailHeader } from './RegulatoryObligationDetailHeader';
import { RegulatoryObligationStaleWarningPanel } from './RegulatoryObligationStaleWarningPanel';
import { obligationTabs, ObligationTabs } from './tabs/ObligationTabs';
import { ObligationOverviewTab } from './tabs/ObligationOverviewTab';
import { RegulatorySourceActionsTab } from '../actions/RegulatorySourceActionsTab';

export function RegulatoryObligationDetailPage({ obligationId, section = 'overview' }: { obligationId: string; section?: string }) {
  const overviewQuery = useRegulatoryObligation(obligationId);
  const sectionQuery = useRegulatoryObligationSection(obligationId, section === 'overview' ? undefined : section);
  const query = section === 'overview' ? overviewQuery : sectionQuery;
  if (query.isLoading) return <RegulatoryLayout current="Obligations"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Obligations"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const obligation = data?.obligation;
  return (
    <RegulatoryLayout current="Obligations">
      <div className="space-y-5">
        <RegulatoryObligationDetailHeader obligation={obligation} obligationId={obligationId} readOnly={data?.readOnly} readOnlyReason={data?.readOnlyReason} onRefresh={() => query.refetch()} />
        {data?.readOnly ? <RegulatoryCard title="Read-only / Locked" subtitle={data.readOnlyReason ?? 'This obligation is read-only under backend status rules.'}><p className="text-sm text-[var(--psm-muted)]">Archived, superseded, approved, or locked obligations require controlled reopen/new-version flow.</p></RegulatoryCard> : null}
        <RegulatoryObligationStaleWarningPanel obligation={obligation} />
        <ObligationTabs obligationId={obligationId} section={section} />
        {section === 'overview' ? (
          <>
            <RegulatoryCard title="Overview Cards">
              <div className="flex flex-wrap gap-2">
                <RegulatoryObligationStatusBadge value={obligation?.obligation_status_calculated ?? obligation?.obligation_status} />
                <RegulatoryObligationApplicabilityBadge value={obligation?.applicability_status} />
                <RegulatoryComplianceStatusBadge status={obligation?.compliance_status} />
                <RegulatoryCriticalityBadge criticality={obligation?.criticality} />
                <RegulatoryObligationEvidenceBadge value={obligation?.evidence_expectation_status} />
                <RegulatoryObligationMappingBadge value={obligation?.module_mapping_status} />
                <RegulatoryObligationStaleBadge value={obligation?.stale_status} reason={obligation?.stale_reason} />
              </div>
            </RegulatoryCard>
            <ObligationOverviewTab data={data} />
          </>
        ) : section === 'actions' ? (
          <RegulatorySourceActionsTab sourcePath={`/regulatory/obligations/${obligationId}/actions`} title="Obligation Actions / CAPA" />
        ) : (
          <RegulatoryCard title={obligationTabs.find(([, key]) => key === section)?.[0] ?? section} subtitle={data?.placeholder ?? 'Foundation section uses backend obligation data and linked adapters only.'}>
            <pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(data, null, 2)}</pre>
          </RegulatoryCard>
        )}
      </div>
    </RegulatoryLayout>
  );
}
