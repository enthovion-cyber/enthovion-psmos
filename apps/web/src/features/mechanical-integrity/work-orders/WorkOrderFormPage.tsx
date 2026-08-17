'use client';

import { useWorkOrderDetail, useWorkOrderLookups } from '../hooks/useWorkOrders';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { WorkOrderForm } from './WorkOrderForm';

export function WorkOrderFormPage({ workOrderId, preset = {} }: { workOrderId?: string | undefined; preset?: Record<string, unknown> }) {
  const lookups = useWorkOrderLookups();
  const detail = useWorkOrderDetail(workOrderId);
  if (workOrderId && detail.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (detail.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load work order for editing.</div>;
  return <div className="space-y-5"><header><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p><h1 className="mt-1 text-2xl font-bold">{workOrderId ? 'Edit Work Order' : 'Create Work Order'}</h1></header><WorkOrderForm detail={detail.data} lookups={lookups.data} preset={preset} /></div>;
}
