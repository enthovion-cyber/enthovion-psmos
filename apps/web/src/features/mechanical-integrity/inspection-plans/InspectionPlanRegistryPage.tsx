'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionPlans } from '../hooks/useInspectionPlans';
import { useInspectionScheduler } from '../hooks/useInspectionScheduler';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { InspectionPlanBulkActions } from './InspectionPlanBulkActions';
import { InspectionPlanFilters } from './InspectionPlanFilters';
import { InspectionPlanHeader } from './InspectionPlanHeader';
import { InspectionPlanMobileCards } from './InspectionPlanMobileCards';
import { InspectionPlanSavedViews } from './InspectionPlanSavedViews';
import { InspectionPlanSummaryCards } from './InspectionPlanSummaryCards';
import { InspectionPlanTable } from './InspectionPlanTable';

export function InspectionPlanRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useInspectionPlans(filters, equipmentId);
  const scheduler = useInspectionScheduler();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Inspection plans could not be loaded.</div>;
  const base = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/inspection-plan` : '/mechanical-integrity/inspection-plans';
  return (
    <div className="space-y-5">
      <InspectionPlanHeader onAdd={() => router.push(`${base}/new`)} onImport={() => router.push('/mechanical-integrity/inspection-plans/import')} onExport={() => window.open('/api/v1/mechanical-integrity/inspection-plans/export', '_blank')} onRunScheduler={() => scheduler.run.mutate({})} schedulerRunning={scheduler.run.isPending} />
      <InspectionPlanSummaryCards summary={query.data.summary} />
      <InspectionPlanSavedViews onSelect={setFilters} />
      <InspectionPlanFilters filters={filters} onChange={setFilters} />
      <InspectionPlanBulkActions selectedCount={0} onExport={() => window.open('/api/v1/mechanical-integrity/inspection-plans/export', '_blank')} onRunScheduler={() => scheduler.run.mutate({})} running={scheduler.run.isPending} />
      <InspectionPlanTable rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/inspection-plans/${row.id}`)} onEdit={(row) => router.push(`/mechanical-integrity/inspection-plans/${row.id}/edit`)} />
      <InspectionPlanMobileCards rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/inspection-plans/${row.id}`)} />
    </div>
  );
}
