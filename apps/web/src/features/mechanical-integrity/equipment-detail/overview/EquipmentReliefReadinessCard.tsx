'use client';

import { useQuery } from '@tanstack/react-query';
import { reliefDeviceService } from '../../services/relief-device.service';
import { ReliefDeviceStatusBadge } from '../../shared/ReliefDeviceStatusBadge';

export function EquipmentReliefReadinessCard({ equipmentId }: { equipmentId: string }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'equipment-relief-readiness', equipmentId], queryFn: () => reliefDeviceService.equipmentProtectionSummary(equipmentId), enabled: !!equipmentId });
  const data = query.data ?? {};
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h3 className="font-semibold">Relief Readiness</h3>
      <p className="text-sm text-[var(--psm-muted)]">Backend readiness impact from missing protection, overdue tests, failed tests, and active impairments.</p>
      <div className="mt-4"><ReliefDeviceStatusBadge status={String(data.readinessStatus ?? 'Not Evaluated')} /></div>
      <p className="mt-3 text-sm text-[var(--psm-muted)]">{Number(data.failedCount ?? 0)} failed test blockers and {Number(data.overdueCount ?? 0)} overdue test blockers.</p>
    </section>
  );
}
