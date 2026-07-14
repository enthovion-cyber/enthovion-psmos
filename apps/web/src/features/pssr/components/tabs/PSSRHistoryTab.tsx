'use client';

import { useState } from 'react';
import { usePSSRHistory } from '../../hooks/usePSSRHistory';
import { PSSRBeforeAfterViewer } from '../history/PSSRBeforeAfterViewer';
import { PSSREventDetailDrawer } from '../history/PSSREventDetailDrawer';
import { PSSRHistoryFilterBar } from '../history/PSSRHistoryFilterBar';
import { PSSRHistorySummaryCard } from '../history/PSSRHistorySummaryCard';
import { PSSRTimeline } from '../history/PSSRTimeline';
import { ErrorState, LoadingState } from '../pssr-ui';

export function PSSRHistoryTab({ pssr }: { pssr: any }) {
  const [filters, setFilters] = useState<Record<string, any>>({ limit: 100 });
  const [selected, setSelected] = useState<any>(null);
  const query = usePSSRHistory(pssr.id, filters);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load PSSR history from API." />;
  const data = query.data ?? {};
  return (
    <div className="space-y-4">
      <PSSRHistoryFilterBar filters={filters} onChange={setFilters} />
      <PSSRHistorySummaryCard summary={data.summary} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <PSSRTimeline events={data.events ?? []} onSelect={setSelected} />
        <div className="space-y-4">
          <PSSREventDetailDrawer event={selected ?? data.events?.[0]} />
          <PSSRBeforeAfterViewer event={selected ?? data.events?.[0]} />
        </div>
      </div>
    </div>
  );
}
