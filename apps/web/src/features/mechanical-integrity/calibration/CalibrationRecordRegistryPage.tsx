'use client';

import { useRouter } from 'next/navigation';
import { CalibrationResultBadge } from '../shared/CalibrationResultBadge';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCalibrationRecords } from '../hooks/useCalibrationRecords';

export function CalibrationRecordRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const query = useCalibrationRecords({}, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Calibration records could not be loaded.</div>;
  return <div className="space-y-5"><header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h1 className="text-xl font-bold">Calibration Records</h1><p className="text-sm text-[var(--psm-muted)]">Tolerance evaluations, as-found/as-left readings, certificates, and approvals.</p></header><div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]"><table className="w-full text-sm"><tbody>{query.data.rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3"><button className="font-semibold text-info" onClick={() => router.push(`/mechanical-integrity/calibration/records/${row.id}`)}>{String(row.record_number ?? row.id)}</button></td><td className="p-3">{String(row.calibration_date ?? '-')}</td><td className="p-3"><CalibrationResultBadge value={row.result ?? null} /></td><td className="p-3">{String(row.status ?? '-')}</td></tr>)}</tbody></table></div></div>;
}
