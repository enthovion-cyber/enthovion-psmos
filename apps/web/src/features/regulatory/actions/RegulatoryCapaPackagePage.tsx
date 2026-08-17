'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryCapaPackages } from '../hooks/useRegulatoryCapaPackages';
import { ActionSummaryCards, CapaPackageTable } from './components/RegulatoryActionUi';

export function RegulatoryCapaPackagePage() {
  const query = useRegulatoryCapaPackages();
  if (query.isLoading) return <RegulatoryLayout current="CAPA Packages"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="CAPA Packages"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="CAPA Packages">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory CAPA Package Foundation" subtitle="Grouped corrective and preventive actions for regulatory closure readiness." action={<RegulatoryButton href="/regulatory/actions/capa/new">Create CAPA Package</RegulatoryButton>} />
        <ActionSummaryCards summary={query.data?.summary} />
        <CapaPackageTable rows={query.data?.rows} onRefresh={() => query.refetch()} />
      </div>
    </RegulatoryLayout>
  );
}
