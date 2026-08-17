'use client';

import type { MiDeficiencySummary } from '../types/deficiency.types';
import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';

export function DeficiencySummaryCards({ summary }: { summary?: MiDeficiencySummary | undefined }) {
  return (
    <SummaryGrid cards={[
      ['Total Open Deficiencies', summary?.totalOpenDeficiencies ?? 0],
      ['Critical Deficiencies', summary?.criticalDeficiencies ?? 0],
      ['High Severity Deficiencies', summary?.highSeverityDeficiencies ?? 0],
      ['Startup Blockers', summary?.startupBlockers ?? 0],
      ['Overdue Deficiencies', summary?.overdueDeficiencies ?? 0],
      ['Pending Review', summary?.pendingReview ?? 0],
      ['Pending Approval', summary?.pendingApproval ?? 0],
      ['Pending Verification', summary?.pendingVerification ?? 0],
      ['Closed This Month', summary?.closedThisMonth ?? 0],
      ['Active Deviations', summary?.activeDeviations ?? 0],
      ['Expiring Deviations', summary?.expiringDeviations ?? 0],
      ['Expired Deviations', summary?.expiredDeviations ?? 0],
      ['Temporary Repairs Active', summary?.temporaryRepairsActive ?? 0],
      ['FFS Required', summary?.ffsRequired ?? 0],
      ['MOC Required / Suggested', summary?.mocRequiredSuggested ?? 0],
      ['Linked Actions Open', summary?.linkedActionsOpen ?? 0],
      ['Linked Work Orders Open', summary?.linkedWorkOrdersOpen ?? 0],
      ['Equipment Not Fit', summary?.equipmentNotFitForService ?? 0],
      ['Fit With Restrictions', summary?.equipmentFitWithRestrictions ?? 0]
    ]} />
  );
}
