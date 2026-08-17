'use client';

import { useState } from 'react';
import { useLinkedRecords } from '../hooks/useLinkedRecords';
import { useLinkedRecordMutations } from '../hooks/useLinkedRecordMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { AddLinkedRecordDialog } from './AddLinkedRecordDialog';
import { LinkedRecordsFilters } from './LinkedRecordsFilters';
import { LinkedRecordsHeader } from './LinkedRecordsHeader';
import { LinkedRecordsMobileCards } from './LinkedRecordsMobileCards';
import { LinkedRecordsSummaryCards } from './LinkedRecordsSummaryCards';
import { LinkedRecordsTable } from './LinkedRecordsTable';
import { LinkedRecordTimeline } from './LinkedRecordTimeline';
import { RelationshipGraphPanel } from './RelationshipGraphPanel';

export function LinkedRecordsDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...initialFilters });
  const [dialog, setDialog] = useState(false);
  const query = useLinkedRecords(filters);
  const mutations = useLinkedRecordMutations();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load linked records. Check permissions and site access.</div>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-5">
    <LinkedRecordsHeader lastUpdated={query.data?.lastUpdated} onAdd={() => setDialog(true)} onRefresh={() => void query.refetch()} />
    <LinkedRecordsSummaryCards summary={query.data?.summary} />
    <div className="grid gap-5 xl:grid-cols-3">
      <RelationshipGraphPanel rows={rows} />
      <SectionCard title="Broken Links Panel" description="Links where the target/source validation no longer resolves."><p className="text-3xl font-bold">{rows.filter((row) => row.broken_link).length}</p></SectionCard>
      <SectionCard title="Permission-Limited Links Panel" description="Links visible only as safe metadata because detailed target permissions are restricted."><p className="text-3xl font-bold">{rows.filter((row) => row.permission_limited).length}</p></SectionCard>
    </div>
    <LinkedRecordsFilters filters={filters} savedViews={query.data?.savedViews} onChange={setFilters} />
    <LinkedRecordsMobileCards rows={rows} />
    <LinkedRecordsTable rows={rows} onRemove={(id) => mutations.remove.mutate(id)} />
    <LinkedRecordTimeline rows={rows} />
    {dialog ? <AddLinkedRecordDialog saving={mutations.create.isPending} onClose={() => setDialog(false)} onSubmit={(input) => mutations.create.mutate(input, { onSuccess: () => setDialog(false) })} /> : null}
  </div>;
}
