'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceLinks } from '../hooks/useRegulatoryEvidenceLinks';
import { useRegulatoryEvidenceLookups } from '../hooks/useRegulatoryEvidenceLookups';
import { RegulatoryEvidenceFilters } from './RegulatoryEvidenceFilters';
import { RegulatoryEvidenceLinkTable } from './RegulatoryEvidenceLinkTable';
import { RegulatoryEvidenceSummaryCards } from './RegulatoryEvidenceSummaryCards';

export function RegulatoryEvidenceRegisterPage({ view, initialFilters }: { view?: string; initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(initialFilters ?? {}) });
  const query = useRegulatoryEvidenceLinks(filters, view);
  const lookups = useRegulatoryEvidenceLookups();
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Evidence">
      <div className="space-y-5">
        <RegulatoryHeader title={view ? `Evidence - ${view}` : 'Evidence Register'} subtitle="Server-side scoped regulatory evidence links with redaction, review, stale status, and source snapshot indicators." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/evidence/links/new">Link Evidence</RegulatoryButton>} />
        <RegulatoryEvidenceSummaryCards summary={query.data?.summary} />
        <RegulatoryEvidenceFilters filters={filters} setFilters={setFilters} lookups={lookups.data} onRefresh={() => query.refetch()} />
        <RegulatoryEvidenceLinkTable rows={query.data?.rows} />
      </div>
    </RegulatoryLayout>
  );
}
