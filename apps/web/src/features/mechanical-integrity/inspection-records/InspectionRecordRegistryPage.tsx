'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionRecords } from '../hooks/useInspectionRecords';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { InspectionImportExportPanel } from './InspectionImportExportPanel';
import { InspectionRecordFilters } from './InspectionRecordFilters';
import { InspectionRecordHeader } from './InspectionRecordHeader';
import { InspectionRecordMobileCards } from './InspectionRecordMobileCards';
import { InspectionRecordSummaryCards } from './InspectionRecordSummaryCards';
import { InspectionRecordTable } from './InspectionRecordTable';
import { InspectionReviewQueuePanel } from './InspectionReviewQueuePanel';

export function InspectionRecordRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useInspectionRecords(filters, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Inspection records could not be loaded.</div>;
  const base = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/inspection-records` : '/mechanical-integrity/inspections';
  const openRecord = (row: { id: string }) => router.push(`/mechanical-integrity/inspections/${row.id}`);
  return (
    <div className="space-y-5">
      <InspectionRecordHeader equipmentId={equipmentId} onAdd={() => router.push(`${base}/new`)} onImport={() => router.push(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/cmls/readings/import` : '/mechanical-integrity/inspections/import')} onExport={() => window.open('/api/v1/mechanical-integrity/inspections/export', '_blank')} onRefresh={() => void query.refetch()} refreshing={query.isFetching} />
      <InspectionRecordSummaryCards summary={query.data.summary} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <InspectionRecordFilters filters={filters} onChange={setFilters} />
          <InspectionRecordTable rows={query.data.rows} onOpen={openRecord} onEdit={(row) => router.push(`/mechanical-integrity/inspections/${row.id}/edit`)} />
          <InspectionRecordMobileCards rows={query.data.rows} onOpen={openRecord} />
        </div>
        <div className="space-y-4">
          <InspectionReviewQueuePanel rows={query.data.rows.filter((row) => /review|submitted/i.test(String(row.review_status ?? row.status)))} onOpen={openRecord} />
          <InspectionImportExportPanel onTemplate={() => window.open('/api/v1/mechanical-integrity/inspections/import-template', '_blank')} onImport={() => router.push(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/cmls/readings/import` : '/mechanical-integrity/inspections/import')} onExport={() => window.open('/api/v1/mechanical-integrity/inspections/export', '_blank')} />
        </div>
      </div>
    </div>
  );
}
