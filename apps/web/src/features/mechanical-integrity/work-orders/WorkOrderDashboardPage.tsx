'use client';

import { useState } from 'react';
import { useMiActions } from '../hooks/useMiActions';
import { useWorkOrderLookups, useWorkOrders } from '../hooks/useWorkOrders';
import { MiActionTable } from '../actions/MiActionTable';
import { ActionButton } from '../safeguards/SafeguardUiPrimitives';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { MyWorkPanel, ReadinessBlockerPanel, WorkOrderCriticalPanel, WorkOrderOverduePanel } from './WorkOrderPanels';
import { WorkOrderFilters } from './WorkOrderFilters';
import { WorkOrderHeader } from './WorkOrderHeader';
import { WorkOrderMobileCards } from './WorkOrderMobileCards';
import { WorkOrderSummaryCards } from './WorkOrderSummaryCards';
import { WorkOrderTable } from './WorkOrderTable';

export function WorkOrderDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const [tableMode, setTableMode] = useState<'work-orders' | 'actions'>('work-orders');
  const query = useWorkOrders(filters);
  const actionsQuery = useMiActions(filters);
  const lookups = useWorkOrderLookups();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load work orders. Check API availability, permissions, and site access.</div>;
  const data = query.data;
  return (
    <div className="space-y-5">
      <WorkOrderHeader lastUpdated={data?.lastUpdated} onRefresh={() => void query.refetch()} />
      <WorkOrderSummaryCards summary={data?.summary} />
      <div className="grid gap-5 xl:grid-cols-4">
        <div className="xl:col-span-2"><WorkOrderCriticalPanel rows={data?.rows} /></div>
        <WorkOrderOverduePanel rows={data?.rows} />
        <ReadinessBlockerPanel rows={data?.rows} />
        <div className="xl:col-span-4"><MyWorkPanel rows={data?.rows} /></div>
      </div>
      <WorkOrderFilters filters={filters} lookups={lookups.data} savedViews={data?.savedViews} onChange={setFilters} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
        <div>
          <p className="text-sm font-semibold">Registry View</p>
          <p className="text-xs text-[var(--psm-muted)]">Toggle between MI work orders and the MI action wrapper view.</p>
        </div>
        <div className="flex gap-2">
          <ActionButton onClick={() => setTableMode('work-orders')} disabled={tableMode === 'work-orders'}>Work Orders</ActionButton>
          <ActionButton onClick={() => setTableMode('actions')} disabled={tableMode === 'actions'}>Actions</ActionButton>
        </div>
      </div>
      {tableMode === 'work-orders' ? (
        <>
          <WorkOrderMobileCards rows={data?.rows} />
          <WorkOrderTable rows={data?.rows} />
        </>
      ) : (
        <MiActionTable rows={actionsQuery.data?.rows ?? []} />
      )}
    </div>
  );
}
