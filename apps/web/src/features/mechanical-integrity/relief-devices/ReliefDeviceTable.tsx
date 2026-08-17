'use client';

import type { ReliefDevice } from '../types/relief-device.types';
import { CertificateStatusBadge } from '../shared/CertificateStatusBadge';
import { ReliefDeviceStatusBadge } from '../shared/ReliefDeviceStatusBadge';
import { ReliefDueStatusBadge } from '../shared/ReliefDueStatusBadge';
import { ReliefTestResultBadge } from '../shared/ReliefTestResultBadge';
import { SealStatusBadge } from '../shared/SealStatusBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';

export function ReliefDeviceTable({ rows, onOpen }: { rows?: ReliefDevice[]; onOpen?: (row: ReliefDevice) => void }) {
  if (!rows?.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No relief devices found for the current filters.</div>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {['Tag', 'Type', 'Protected equipment', 'Service fluid', 'Set pressure', 'Capacity', 'Status', 'Safety critical', 'Last test', 'Next due', 'Due status', 'Last result', 'Certificate', 'Seal', 'Startup', 'Site/Unit/Area', 'Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-4 py-3 font-semibold">{row.deviceTag ?? row.device_tag}</td>
              <td className="px-4 py-3">{row.deviceType ?? row.device_type}</td>
              <td className="px-4 py-3">{row.protectedEquipmentCount ?? row.protected_equipment_count ?? 0}</td>
              <td className="px-4 py-3">{row.serviceFluid ?? row.service_fluid ?? 'Not recorded'}</td>
              <td className="px-4 py-3">{row.setPressure ?? 'Not set'}</td>
              <td className="px-4 py-3">{row.ratedCapacity ?? 'Not set'}</td>
              <td className="px-4 py-3"><ReliefDeviceStatusBadge status={row.status} /></td>
              <td className="px-4 py-3">{row.safetyCritical ?? row.safety_critical ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">{row.lastTestDate ?? row.last_test_date ?? 'None'}</td>
              <td className="px-4 py-3">{row.nextTestDueDate ?? row.next_test_due_date ?? 'Not scheduled'}</td>
              <td className="px-4 py-3"><ReliefDueStatusBadge status={row.dueStatus ?? row.due_status} /></td>
              <td className="px-4 py-3"><ReliefTestResultBadge result={row.lastTestResult ?? row.last_test_result} /></td>
              <td className="px-4 py-3"><CertificateStatusBadge value={row.certificateStatus ?? row.certificate_status} /></td>
              <td className="px-4 py-3"><SealStatusBadge status={row.sealStatus ?? row.seal_status} /></td>
              <td className="px-4 py-3"><StartupBlockedBadge blocked={row.startupBlocked ?? row.startup_blocked} /></td>
              <td className="px-4 py-3">{[row['site_id' as keyof ReliefDevice], row['unit_id' as keyof ReliefDevice], row['area_id' as keyof ReliefDevice]].filter(Boolean).join(' / ') || 'Scope set'}</td>
              <td className="px-4 py-3"><button type="button" onClick={() => onOpen?.(row)} className="rounded-lg border border-[var(--psm-line)] px-3 py-1 text-xs font-semibold">Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
