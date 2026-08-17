'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ReliefTestResultBadge } from '../shared/ReliefTestResultBadge';
import { useReliefTests } from '../hooks/useReliefTests';

export function ReliefTestRegistryPage({ equipmentId, filter }: { equipmentId?: string; filter?: Record<string, unknown> }) {
  const router = useRouter();
  const query = useReliefTests(filter ?? {}, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Relief tests could not be loaded.</div>;
  const rows = query.data.rows ?? [];
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h1 className="text-2xl font-bold">PSV / Relief Test Records</h1>
        <p className="text-sm text-[var(--psm-muted)]">As-found/as-left, pop, leak, repair, review, and certificate records.</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Record', 'Relief device', 'Protected equipment', 'Date', 'Type', 'Status', 'Review', 'Result', 'Vendor', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--psm-line)]">
                <td className="px-4 py-3 font-semibold">{row.testRecordNumber ?? row.test_record_number}</td>
                <td className="px-4 py-3">{row.reliefDeviceTag ?? row.reliefDeviceId ?? row.relief_device_id}</td>
                <td className="px-4 py-3">{row.protectedEquipmentTag ?? row.protectedEquipmentId ?? row.protected_equipment_id ?? 'Not linked'}</td>
                <td className="px-4 py-3">{row.testDate ?? row.test_date}</td>
                <td className="px-4 py-3">{row.testType ?? row.test_type ?? 'Test'}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{row.reviewStatus ?? row.review_status}</td>
                <td className="px-4 py-3"><ReliefTestResultBadge result={row.finalResult ?? row.final_result} /></td>
                <td className="px-4 py-3">{row.test_vendor ?? 'Not recorded'}</td>
                <td className="px-4 py-3"><button type="button" className="rounded-lg border border-[var(--psm-line)] px-3 py-1 text-xs font-semibold" onClick={() => router.push(`/mechanical-integrity/relief-devices/tests/${row.id}`)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-5 text-sm text-[var(--psm-muted)]">No relief test records found.</p> : null}
      </div>
    </div>
  );
}
