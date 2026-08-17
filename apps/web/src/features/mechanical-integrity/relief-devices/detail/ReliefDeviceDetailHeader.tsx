import Link from 'next/link';
import type { ReliefDevice } from '../../types/relief-device.types';
import { CertificateStatusBadge } from '../../shared/CertificateStatusBadge';
import { ReliefDeviceStatusBadge } from '../../shared/ReliefDeviceStatusBadge';
import { ReliefDueStatusBadge } from '../../shared/ReliefDueStatusBadge';
import { StartupBlockedBadge } from '../../shared/StartupBlockedBadge';

export function ReliefDeviceDetailHeader({ device }: { device: ReliefDevice }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Relief Device</p>
          <h1 className="text-2xl font-bold">{device.deviceTag ?? device.device_tag}</h1>
          <p className="text-sm text-[var(--psm-muted)]">{device.deviceName ?? device.device_name ?? device.deviceType ?? device.device_type}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ReliefDeviceStatusBadge status={device.status} />
            <ReliefDueStatusBadge status={device.dueStatus ?? device.due_status} />
            <CertificateStatusBadge value={device.certificateStatus ?? device.certificate_status} />
            <StartupBlockedBadge blocked={device.startupBlocked ?? device.startup_blocked} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" href={`/mechanical-integrity/relief-devices/${device.id}/edit`}>Edit</Link>
          <Link className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" href={`/mechanical-integrity/relief-devices/tests/new?reliefDeviceId=${device.id}`}>Create test</Link>
        </div>
      </div>
    </header>
  );
}
