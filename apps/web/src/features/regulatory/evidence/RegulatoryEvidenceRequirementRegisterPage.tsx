'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceRequirements } from '../hooks/useRegulatoryEvidenceRequirements';
import { useRegulatoryEvidenceLookups } from '../hooks/useRegulatoryEvidenceLookups';
import { RegulatoryEvidenceFilters } from './RegulatoryEvidenceFilters';
import { RegulatoryEvidenceRequirementTable } from './RegulatoryEvidenceRequirementTable';

export function RegulatoryEvidenceRequirementRegisterPage({ initialFilters }: { initialFilters?: Record<string, unknown> } = {}) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(initialFilters ?? {}) });
  const query = useRegulatoryEvidenceRequirements(filters);
  const lookups = useRegulatoryEvidenceLookups();
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Evidence">
      <div className="space-y-5">
        <RegulatoryHeader title="Required Evidence" subtitle="Define evidence requirements against regulatory items, obligations, compliance assessments, and gaps." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/evidence/requirements/new">New Requirement</RegulatoryButton>} />
        <RegulatoryEvidenceFilters filters={filters} setFilters={setFilters} lookups={lookups.data} onRefresh={() => query.refetch()} />
        <RegulatoryEvidenceRequirementTable rows={query.data?.rows} />
      </div>
    </RegulatoryLayout>
  );
}
