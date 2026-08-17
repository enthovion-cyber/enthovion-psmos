'use client';

import { useState } from 'react';
import { useEquipmentRegistry } from '../hooks/useEquipmentRegistry';
import type { MiEquipmentFilters } from '../services/equipment.service';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { EquipmentRegistryHeader } from './EquipmentRegistryHeader';
import { EquipmentSummaryCards } from './EquipmentSummaryCards';
import { EquipmentFilters } from './EquipmentFilters';
import { EquipmentSavedViews } from './EquipmentSavedViews';
import { EquipmentTable } from './EquipmentTable';
import { EquipmentMobileCards } from './EquipmentMobileCards';
import { EquipmentBulkActions } from './EquipmentBulkActions';
import { EquipmentImportDialog } from './EquipmentImportDialog';

export function EquipmentRegistryPage() {
  const [filters, setFilters] = useState<MiEquipmentFilters>({ page: 1, limit: 25, sort: 'tag.asc' });
  const [importOpen, setImportOpen] = useState(false);
  const query = useEquipmentRegistry(filters);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="psm-card p-8 text-danger">Equipment Registry unavailable.</div>;
  const data = query.data;
  return (
    <div className="space-y-5">
      <EquipmentRegistryHeader total={data.total} lastUpdated={data.lastUpdated} onImport={() => setImportOpen(true)} />
      <EquipmentSummaryCards cards={data.summary} />
      <EquipmentSavedViews views={data.savedViews} onSelect={(view) => setFilters((current) => ({ ...current, q: view, page: 1 }))} />
      <EquipmentFilters filters={filters} onChange={setFilters} />
      <EquipmentBulkActions selectedCount={0} />
      <div className="hidden lg:block"><EquipmentTable rows={data.rows} page={data.page} limit={data.limit} total={data.total} onPage={(page) => setFilters((current) => ({ ...current, page }))} /></div>
      <div className="lg:hidden"><EquipmentMobileCards rows={data.rows} /></div>
      <EquipmentImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
