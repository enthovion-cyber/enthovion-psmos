'use client';

import Link from 'next/link';
import { MiActionsPage } from '../../actions/MiActionsPage';
import { ActionButton, SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { WorkOrderDashboardPage } from '../../work-orders/WorkOrderDashboardPage';

export function WorkOrdersActionsTab({ equipmentId }: { equipmentId: string }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Equipment Work Orders / Actions" description="Open work, corrective actions, PTW/LOTO/parts blockers, verification, and readiness impact scoped to this equipment.">
        <div className="flex flex-wrap gap-2">
          <Link href={`/mechanical-integrity/equipment/${equipmentId}/work-orders/new`}><ActionButton>Create Work Order</ActionButton></Link>
          <Link href={`/mechanical-integrity/actions/new?equipmentId=${equipmentId}`}><ActionButton>Create Action</ActionButton></Link>
          <Link href={`/mechanical-integrity/equipment/${equipmentId}/work-orders`}><ActionButton>Open Work Orders</ActionButton></Link>
          <Link href={`/mechanical-integrity/equipment/${equipmentId}/actions`}><ActionButton>Open Actions</ActionButton></Link>
        </div>
      </SectionCard>
      <WorkOrderDashboardPage initialFilters={{ equipmentId }} />
      <MiActionsPage initialFilters={{ equipmentId }} />
    </div>
  );
}
