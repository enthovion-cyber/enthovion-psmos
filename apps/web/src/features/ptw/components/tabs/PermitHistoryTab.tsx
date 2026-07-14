'use client';

import { useState } from 'react';
import { BeforeAfterDrawer } from '../history/BeforeAfterDrawer';
import { PermitHistoryFilterBar } from '../history/PermitHistoryFilterBar';
import { PermitHistorySummaryCard } from '../history/PermitHistorySummaryCard';
import { PermitTimeline } from '../history/PermitTimeline';
import { usePermitHistory, usePermitHistorySummary } from '../../hooks/usePermitHistory';
import { ptwHistoryService, type PermitHistoryEvent, type PermitHistoryFilters } from '../../services/ptw-history.service';

export function PermitHistoryTab({ permit }: { permit: any }) {
  const [filters, setFilters] = useState<PermitHistoryFilters>({ category: 'All', limit: 100 });
  const [selected, setSelected] = useState<PermitHistoryEvent | null>(null);
  const rows = usePermitHistory(permit.id, filters);
  const summary = usePermitHistorySummary(permit.id);
  const exportFile = (kind: 'pdf' | 'csv') => window.open(ptwHistoryService.exportUrl(permit.id, kind), '_blank');
  return <div className="space-y-4"><PermitHistorySummaryCard summary={summary.data} /><PermitHistoryFilterBar filters={filters} onChange={setFilters} onExportPdf={() => exportFile('pdf')} onExportCsv={() => exportFile('csv')} />{rows.isError ? <section className="psm-card p-5 text-danger">Unable to load permit history. Adjust filters or retry.</section> : null}<PermitTimeline rows={rows.data} loading={rows.isLoading} onOpen={setSelected} /><BeforeAfterDrawer event={selected} onClose={() => setSelected(null)} /></div>;
}
