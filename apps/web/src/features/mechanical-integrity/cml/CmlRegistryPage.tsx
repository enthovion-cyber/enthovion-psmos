'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCmlRegistry } from '../hooks/useCmlRegistry';
import { useCmlMutations } from '../hooks/useCmlMutations';
import { useEquipmentHeader } from '../hooks/useEquipmentHeader';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { CmlAlertPanel } from './CmlAlertPanel';
import { CmlBulkActions } from './CmlBulkActions';
import { CmlFilters } from './CmlFilters';
import { CmlHeader } from './CmlHeader';
import { CmlMobileCards } from './CmlMobileCards';
import { CmlReadingHistoryPreview } from './CmlReadingHistoryPreview';
import { CmlSavedViews } from './CmlSavedViews';
import { CmlSummaryCards } from './CmlSummaryCards';
import { CmlTable } from './CmlTable';

export function CmlRegistryPage({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useCmlRegistry(equipmentId, filters);
  const header = useEquipmentHeader(equipmentId);
  const mutations = useCmlMutations(equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">CML/TML registry could not be loaded.</div>;
  const open = (id: string) => router.push(`/mechanical-integrity/equipment/${equipmentId}/cmls/${id}`);
  return (
    <div className="space-y-5">
      <CmlHeader equipmentId={equipmentId} equipmentLabel={header.data?.equipment ? `${header.data.equipment.tag ?? ''} ${header.data.equipment.name ?? ''}`.trim() : null} onAdd={() => router.push(`/mechanical-integrity/equipment/${equipmentId}/cmls/new`)} onImport={() => router.push(`/mechanical-integrity/equipment/${equipmentId}/cmls/import`)} onImportReadings={() => router.push(`/mechanical-integrity/equipment/${equipmentId}/cmls/readings/import`)} onExport={() => window.open(`/api/v1/mechanical-integrity/equipment/${equipmentId}/cmls/export`, '_blank')} onRecalculate={() => mutations.recalculateAll.mutate()} recalculating={mutations.recalculateAll.isPending} />
      <CmlSummaryCards summary={query.data.summary} />
      <CmlSavedViews onSelect={(viewFilters) => setFilters(viewFilters)} />
      <CmlFilters filters={filters} onChange={setFilters} />
      <CmlBulkActions selectedCount={0} onExport={() => window.open(`/api/v1/mechanical-integrity/equipment/${equipmentId}/cmls/export`, '_blank')} onRecalculate={() => mutations.recalculateAll.mutate()} recalculating={mutations.recalculateAll.isPending} />
      <CmlAlertPanel alerts={query.data.alerts ?? []} />
      <CmlTable rows={query.data.rows} onOpen={(row) => open(row.id)} />
      <CmlMobileCards rows={query.data.rows} onOpen={(row) => open(row.id)} />
      <CmlReadingHistoryPreview rows={query.data.rows} />
    </div>
  );
}
