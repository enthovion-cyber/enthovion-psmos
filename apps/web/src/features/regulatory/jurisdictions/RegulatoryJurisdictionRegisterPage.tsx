'use client';
import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, RegulatoryButton, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryJurisdictions } from '../hooks/useRegulatoryJurisdictions';
import { RegulatoryJurisdictionTable } from './RegulatoryJurisdictionTable';

export function RegulatoryJurisdictionRegisterPage() {
  const [search, setSearch] = useState('');
  const query = useRegulatoryJurisdictions({ search });
  return (
    <RegulatoryLayout current="Jurisdictions">
      <div className="space-y-5">
        <RegulatoryHeader title="Jurisdiction Register" subtitle="Filter by jurisdiction name, level, country, state, city, zone, status, and owner." action={<RegulatoryButton href="/regulatory/jurisdictions/new">New Jurisdiction</RegulatoryButton>} />
        <RegulatoryCard title="Filters / Search"><input className={regulatoryInputClass()} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jurisdictions..." /></RegulatoryCard>
        {query.isLoading ? <RegulatoryLoadingState /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /> : <RegulatoryJurisdictionTable rows={query.data?.rows} />}
      </div>
    </RegulatoryLayout>
  );
}
