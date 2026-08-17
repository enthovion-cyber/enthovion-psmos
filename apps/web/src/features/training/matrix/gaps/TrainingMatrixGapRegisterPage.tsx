'use client';

import { useState } from 'react';
import { useMatrixGaps } from '../../hooks/useMatrixGaps';
import { TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { TrainingMatrixFilters } from '../TrainingMatrixFilters';
import { TrainingMatrixHeader } from '../TrainingMatrixHeader';
import { TrainingMatrixGapDetailPanel } from './TrainingMatrixGapDetailPanel';
import { TrainingMatrixGapLifecyclePanel } from './TrainingMatrixGapLifecyclePanel';
import { TrainingMatrixGapTable } from './TrainingMatrixGapTable';

export function TrainingMatrixGapRegisterPage({ defaultFilters = {} }: { defaultFilters?: Record<string, any> }) {
  const [filters, setFilters] = useState<Record<string, any>>({ page: 1, limit: 25, ...defaultFilters });
  const query = useMatrixGaps(filters);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const selected = query.data?.rows?.[0];
  return <div className="space-y-5"><TrainingMatrixHeader title="Training Gap Register" subtitle="Missing, overdue, expiring, verification, PTW/MOC/PSSR, and safety-critical blockers." /><TrainingMatrixFilters filters={filters} onChange={setFilters} /><TrainingMatrixGapTable rows={query.data?.rows ?? []} /><div className="grid gap-4 xl:grid-cols-2"><TrainingMatrixGapDetailPanel gap={selected} /><TrainingMatrixGapLifecyclePanel gap={selected} /></div></div>;
}
