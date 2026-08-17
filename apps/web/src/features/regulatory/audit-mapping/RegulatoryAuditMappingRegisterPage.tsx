'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappings, useRegulatoryAuditMappingsFromSource } from '../hooks/useRegulatoryAuditMappings';
import { RegulatoryAuditMappingFilters } from './RegulatoryAuditMappingFilters';
import { RegulatoryAuditMappingMobileCards } from './RegulatoryAuditMappingMobileCards';
import { RegulatoryAuditMappingSummaryCards } from './RegulatoryAuditMappingSummaryCards';
import { RegulatoryAuditMappingTable } from './RegulatoryAuditMappingTable';

export function RegulatoryAuditMappingRegisterPage({ view, source }: { view?: string; source?: { kind: string; id: string } }) {
  const [search, setSearch] = useState('');
  const params = { search, limit: 50 };
  const registerQuery = useRegulatoryAuditMappings(params, view);
  const sourceQuery = useRegulatoryAuditMappingsFromSource(source, params);
  const query = source ? sourceQuery : registerQuery;
  if (query.isLoading) return <RegulatoryLayout current="Audit Mapping"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Mapping"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Audit Mapping">
      <div className="space-y-5">
        <RegulatoryHeader title={view ? `Audit Mapping - ${view}` : 'Audit Mapping Register'} subtitle="Server-side audit mapping register with regulatory source, audit target, coverage, verification, readiness, stale, owner, and due-date status." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/audit-mapping/new">New Mapping</RegulatoryButton>} />
        <RegulatoryAuditMappingFilters search={search} setSearch={setSearch} onRefresh={() => query.refetch()} />
        <RegulatoryAuditMappingSummaryCards summary={query.data?.summary} />
        <RegulatoryAuditMappingTable rows={query.data?.rows} />
        <RegulatoryAuditMappingMobileCards rows={query.data?.rows} />
      </div>
    </RegulatoryLayout>
  );
}
