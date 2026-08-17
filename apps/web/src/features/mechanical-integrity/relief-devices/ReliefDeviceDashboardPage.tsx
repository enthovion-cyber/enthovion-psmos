'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useReliefDeviceDashboard } from '../hooks/useReliefDevices';
import { useReliefScheduler } from '../hooks/useReliefScheduler';
import { ReliefDeviceDuePanel } from './ReliefDeviceDuePanel';
import { ReliefDeviceFailedPanel } from './ReliefDeviceFailedPanel';
import { ReliefDeviceFilters } from './ReliefDeviceFilters';
import { ReliefDeviceHeader } from './ReliefDeviceHeader';
import { ReliefDeviceMobileCards } from './ReliefDeviceMobileCards';
import { ReliefDeviceSavedViews } from './ReliefDeviceSavedViews';
import { ReliefDeviceSummaryCards } from './ReliefDeviceSummaryCards';
import { ReliefDeviceTable } from './ReliefDeviceTable';

export function ReliefDeviceDashboardPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useReliefDeviceDashboard(filters);
  const scheduler = useReliefScheduler();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">PSV / relief device dashboard could not be loaded.</div>;
  const data = query.data as any;
  return (
    <div className="space-y-5">
      <ReliefDeviceHeader lastUpdated={data.header?.lastUpdated} onRunScheduler={() => scheduler.mutate()} />
      <ReliefDeviceSummaryCards summary={data.summary} />
      <ReliefDeviceSavedViews />
      <ReliefDeviceFilters value={filters} onChange={setFilters} />
      <section className="grid gap-5 xl:grid-cols-2">
        <ReliefDeviceDuePanel rows={data.due} />
        <ReliefDeviceFailedPanel rows={data.failed} />
      </section>
      <div className="hidden lg:block"><ReliefDeviceTable rows={data.rows} onOpen={(row) => router.push(`/mechanical-integrity/relief-devices/${row.id}`)} /></div>
      <ReliefDeviceMobileCards rows={data.rows} />
    </div>
  );
}
