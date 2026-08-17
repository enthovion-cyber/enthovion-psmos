'use client';

import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useReliefDeviceDetail } from '../hooks/useReliefDeviceDetail';
import { ReliefDeviceForm } from './ReliefDeviceForm';

export function ReliefDeviceFormPage({ reliefDeviceId, equipmentId }: { reliefDeviceId?: string | undefined; equipmentId?: string | undefined }) {
  const query = useReliefDeviceDetail(reliefDeviceId);
  if (reliefDeviceId && query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (reliefDeviceId && (query.isError || !query.data)) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Relief device could not be loaded for editing.</div>;
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h1 className="text-2xl font-bold">{reliefDeviceId ? 'Edit Relief Device' : 'New Relief Device'}</h1>
        <p className="text-sm text-[var(--psm-muted)]">Complete the identification, protected equipment, technical, basis, test, seal, and certificate foundations.</p>
      </header>
      <ReliefDeviceForm initial={query.data} equipmentId={equipmentId} />
    </div>
  );
}
