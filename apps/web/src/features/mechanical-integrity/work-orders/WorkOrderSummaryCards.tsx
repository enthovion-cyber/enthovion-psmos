'use client';

import type { MiWorkOrderSummary } from '../types/work-order.types';
import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';

export function WorkOrderSummaryCards({ summary }: { summary?: MiWorkOrderSummary | undefined }) {
  return (
    <SummaryGrid cards={[
      ['Total Open Work Orders', summary?.totalOpenWorkOrders ?? 0],
      ['Critical Work Orders', summary?.criticalWorkOrders ?? 0],
      ['Safety-Critical Work', summary?.safetyCriticalWork ?? 0],
      ['Overdue Work Orders', summary?.overdueWorkOrders ?? 0],
      ['Due This Week', summary?.dueThisWeek ?? 0],
      ['Pending Planning', summary?.pendingPlanning ?? 0],
      ['Waiting Approval', summary?.waitingApproval ?? 0],
      ['Waiting PTW', summary?.waitingPtw ?? 0],
      ['Waiting LOTO', summary?.waitingLoto ?? 0],
      ['Waiting Parts', summary?.waitingParts ?? 0],
      ['Waiting Shutdown', summary?.waitingShutdown ?? 0],
      ['In Progress', summary?.inProgress ?? 0],
      ['Pending Verification', summary?.pendingVerification ?? 0],
      ['Failed Verification', summary?.failedVerification ?? 0],
      ['Closed This Month', summary?.closedThisMonth ?? 0],
      ['Linked Deficiencies Open', summary?.linkedDeficienciesOpen ?? 0],
      ['Startup Blocker Work', summary?.startupBlockerWork ?? 0],
      ['MOC Required Work', summary?.mocRequiredWork ?? 0],
      ['My Assigned Work', summary?.myAssignedWork ?? 0],
      ['Contractor Assigned Work', summary?.contractorAssignedWork ?? 0]
    ]} />
  );
}
