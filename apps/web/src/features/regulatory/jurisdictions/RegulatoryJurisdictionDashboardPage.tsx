'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, RegulatoryButton } from '../shared/RegulatoryUi';
import { useRegulatoryJurisdictionDashboard } from '../hooks/useRegulatoryJurisdictionDashboard';
import { RegulatoryJurisdictionSummaryCards } from './RegulatoryJurisdictionSummaryCards';
import { RegulatoryJurisdictionTable } from './RegulatoryJurisdictionTable';

export function RegulatoryJurisdictionDashboardPage() {
  const query = useRegulatoryJurisdictionDashboard();
  if (query.isLoading) return <RegulatoryLayout current="Jurisdiction Dashboard"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Jurisdiction Dashboard"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  return (
    <RegulatoryLayout current="Jurisdiction Dashboard">
      <div className="space-y-5">
        <RegulatoryHeader title="Jurisdiction Management" subtitle="Countries, states/provinces, cities, industrial zones, corporate and site-specific jurisdiction foundation." action={<RegulatoryButton href="/regulatory/jurisdictions/new">New Jurisdiction</RegulatoryButton>} />
        <RegulatoryJurisdictionSummaryCards summary={data?.summary} />
        <RegulatoryCard title="Recently Updated Jurisdictions" subtitle="Real jurisdiction records only. No fake authorities or legal claims are generated."><RegulatoryJurisdictionTable rows={data?.recentlyUpdated} /></RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
