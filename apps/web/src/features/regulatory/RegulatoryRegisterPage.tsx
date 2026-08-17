'use client';

import { useState } from 'react';
import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatorySummaryCards } from './RegulatorySummaryCards';
import { RegulatoryRegisterFilters } from './RegulatoryRegisterFilters';
import { RegulatoryRegisterTable } from './RegulatoryRegisterTable';
import { RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState, RegulatoryButton } from './shared/RegulatoryUi';
import { useRegulatoryRegister } from './hooks/useRegulatoryRegister';

export function RegulatoryRegisterPage({ view }: { view?: string | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc' });
  const query = useRegulatoryRegister(filters, view);
  if (query.isLoading) return <RegulatoryLayout current="Register"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Register"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const empty = !Number(data?.total ?? 0);
  return (
    <RegulatoryLayout current="Register">
      <div className="space-y-5">
        <RegulatoryHeader title={view ? `Regulatory Register - ${view}` : 'Regulatory Register'} subtitle="Audit-ready register of laws, regulations, standards, codes, permits, corporate requirements, and site compliance requirements." onRefresh={() => query.refetch()} />
        {empty ? <RegulatoryEmptyState title="No register items" message="No regulatory requirements match this company/site scope and filter set." action={<RegulatoryButton href="/regulatory/new">Add Regulatory Requirement</RegulatoryButton>} /> : null}
        <RegulatorySummaryCards summary={data?.summary} />
        <RegulatoryRegisterFilters filters={filters} setFilters={setFilters} loading={query.isFetching} />
        <RegulatoryRegisterTable register={data} setFilters={(fn) => setFilters((current) => fn(current))} />
      </div>
    </RegulatoryLayout>
  );
}
