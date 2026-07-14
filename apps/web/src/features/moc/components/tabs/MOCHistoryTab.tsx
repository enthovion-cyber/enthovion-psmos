'use client';

import { useState } from 'react';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { MOCEventDetailDrawer } from '../history/MOCEventDetailDrawer';
import { MOCHistoryFilterBar } from '../history/MOCHistoryFilterBar';
import { MOCHistorySummaryCard } from '../history/MOCHistorySummaryCard';
import { MOCTimeline } from '../history/MOCTimeline';
import { useMOCHistory } from '../../hooks/useMOCHistory';
import { mocHistoryService } from '../../services/moc-history.service';

export function MOCHistoryTab({ moc }: { moc: any }) {
  const [filters, setFilters] = useState<Record<string, any>>({ limit: 50 });
  const [selected, setSelected] = useState<any>(null);
  const { events, summary } = useMOCHistory(moc.id, filters);

  if (events.isLoading || summary.isLoading) return <LoadingState />;
  if (events.isError) return <ErrorState message="Unable to load MOC history." />;

  return (
    <div className="space-y-4">
      <MOCHistorySummaryCard summary={summary.data} />
      <MOCHistoryFilterBar filters={filters} setFilters={setFilters} onExportCsv={() => mocHistoryService.exportCsv(moc.id)} onExportPdf={() => mocHistoryService.exportPdf(moc.id)} />
      <MOCTimeline events={events.data ?? []} onOpen={setSelected} />
      <MOCEventDetailDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
