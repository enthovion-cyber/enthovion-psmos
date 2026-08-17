'use client';

import { InspectionPlanRegistryPage } from '../inspection-plans/InspectionPlanRegistryPage';
import { SchedulerRunHistoryPage } from './SchedulerRunHistoryPage';

export function InspectionSchedulerPage() {
  return <div className="space-y-6"><SchedulerRunHistoryPage /><InspectionPlanRegistryPage /></div>;
}
