'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { useReliefDevices } from '../../hooks/useReliefDevices';
import { useReliefTests } from '../../hooks/useReliefTests';
import { ReliefDeviceDuePanel } from '../../relief-devices/ReliefDeviceDuePanel';
import { ReliefDeviceFailedPanel } from '../../relief-devices/ReliefDeviceFailedPanel';
import { ReliefDeviceSummaryCards } from '../../relief-devices/ReliefDeviceSummaryCards';
import { ReliefDeviceTable } from '../../relief-devices/ReliefDeviceTable';

export function ReliefDevicesTab({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const query = useReliefDevices({}, equipmentId);
  const testsQuery = useReliefTests({ status: 'Failed' }, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Equipment relief devices could not be loaded.</div>;
  const rows = query.data.rows ?? [];
  const failedTests = (testsQuery.data?.rows ?? []).filter((row) => String(row.finalResult ?? row.final_result ?? '').toLowerCase().includes('failed'));
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">PSV / Relief Devices</h2>
            <p className="text-sm text-[var(--psm-muted)]">Protected relief devices, test due status, failed test blockers, certificates, and seal status for this equipment.</p>
          </div>
          <button type="button" onClick={() => router.push(`/mechanical-integrity/equipment/${equipmentId}/relief-devices/new`)} className="rounded-lg bg-info px-3 py-2 text-sm font-semibold text-white">Add relief device</button>
        </div>
      </header>
      <ReliefDeviceSummaryCards summary={query.data.summary} />
      <section className="grid gap-5 xl:grid-cols-2">
        <ReliefDeviceDuePanel rows={rows} />
        <ReliefDeviceFailedPanel rows={failedTests} />
      </section>
      <ReliefDeviceTable rows={rows} onOpen={(row) => router.push(`/mechanical-integrity/relief-devices/${row.id}`)} />
    </div>
  );
}
