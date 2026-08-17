'use client';

import { useQuery } from '@tanstack/react-query';
import { reliefDeviceService } from '../../services/relief-device.service';
import { StartupBlockedBadge } from '../../shared/StartupBlockedBadge';

export function EquipmentReliefProtectionSummaryCard({ equipmentId }: { equipmentId: string }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'equipment-relief-protection', equipmentId], queryFn: () => reliefDeviceService.equipmentProtectionSummary(equipmentId), enabled: !!equipmentId });
  const data = query.data ?? {};
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Relief Protection</h3>
          <p className="text-sm text-[var(--psm-muted)]">PSV/relief relationship coverage and protection readiness.</p>
        </div>
        <StartupBlockedBadge blocked={Boolean(data.startupBlocked)} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-[var(--psm-muted)]">Relief devices</dt><dd className="text-xl font-bold">{Number(data.reliefDeviceCount ?? 0)}</dd></div>
        <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-[var(--psm-muted)]">Overdue</dt><dd className="text-xl font-bold">{Number(data.overdueCount ?? 0)}</dd></div>
      </dl>
    </section>
  );
}
