import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import { ReliefDeviceStatusBadge } from '../../shared/ReliefDeviceStatusBadge';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { MiReliefDeviceSyncDiffPanel } from '../MiReliefDeviceSyncDiffPanel';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function ReliefDeviceProtectionTab({ detail }: { detail: ReliefSystemDetail }) {
  return (
    <div className="space-y-5">
      <PsiCard title="Relief Device / Protection" subtitle="Linked PSV/rupture disc/protection records, MI device snapshot, set pressure, rated capacity, test status, bypass/impairment, and removal protection.">
        {!detail.deviceLinks.length ? <PsiEmptyState title="No relief device linked" message="Link the MI relief device or document alternate relief protection before approval." /> : (
          <div className="space-y-4">{detail.deviceLinks.map((row) => <div key={String(row.id ?? row.relief_device_tag)} className="space-y-3"><ReliefDeviceStatusBadge value={String(row.device_status ?? 'Linked')} /><ReliefSystemFieldGrid items={[
            { label: 'MI relief device ID', value: valueOf(row, 'mi_relief_device_id') },
            { label: 'Relief device tag', value: valueOf(row, 'relief_device_tag') },
            { label: 'Device type', value: valueOf(row, 'relief_device_type') },
            { label: 'Set pressure', value: `${valueOf(row, 'set_pressure', 'Missing')} ${valueOf(row, 'set_pressure_unit', '')}` },
            { label: 'Rated capacity', value: `${valueOf(row, 'rated_capacity', 'Missing')} ${valueOf(row, 'rated_capacity_unit', '')}` },
            { label: 'Last test status', value: valueOf(row, 'last_test_status') },
            { label: 'Bypass active', value: valueOf(row, 'bypass_active') },
            { label: 'Car seal required', value: valueOf(row, 'car_seal_required') },
            { label: 'MI status', value: valueOf(row, 'mi_status') }
          ]} /></div>)}</div>
        )}
      </PsiCard>
      <MiReliefDeviceSyncDiffPanel rows={detail.syncEvents} />
    </div>
  );
}
