'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionSchedulerService } from '../../services/inspection-scheduler.service';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { InspectionOccurrencesTable } from '../../inspection-scheduler/InspectionOccurrencesTable';

export function InspectionScheduleTab({ equipmentId }: { equipmentId: string }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'inspection-schedule'], queryFn: () => inspectionSchedulerService.equipmentSchedule(equipmentId) });
  if (query.isLoading) return <MiLoadingSkeleton rows={4} />;
  const rows = (query.data?.occurrences as Array<Record<string, unknown>> | undefined) ?? [];
  return <div className="space-y-5"><InspectionOccurrencesTable rows={rows} /></div>;
}
