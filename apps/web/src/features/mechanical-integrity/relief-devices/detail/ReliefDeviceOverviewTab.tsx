import type { ReliefDeviceDetailResponse } from '../../types/relief-device.types';
import { ReliefDeviceSummaryCards } from '../ReliefDeviceSummaryCards';
import { DetailPanel, KeyValueGrid } from './detail-utils';

export function ReliefDeviceOverviewTab({ detail }: { detail: ReliefDeviceDetailResponse }) {
  const blockers = detail.device.readinessBlockers ?? detail.device.readiness_blockers_json ?? [];
  return (
    <div className="space-y-5">
      <ReliefDeviceSummaryCards summary={{ totalReliefDevices: 1, protectedEquipmentCount: detail.protectedEquipment?.length ?? 0, overdueTests: detail.device.dueStatus === 'Overdue' ? 1 : 0, failedTests: /fail/i.test(String(detail.device.lastTestResult)) ? 1 : 0, startupBlocked: detail.device.startupBlocked ? 1 : 0, certificatesMissingOrExpiring: detail.certificates?.length ? 0 : 1 }} />
      <div className="grid gap-5 xl:grid-cols-2">
        <DetailPanel title="Device snapshot"><KeyValueGrid data={detail.device as unknown as Record<string, unknown>} /></DetailPanel>
        <DetailPanel title="Readiness / blockers">{blockers.length ? <ul className="space-y-2 text-sm">{blockers.map((item) => <li key={item} className="rounded-lg bg-danger/10 p-3 text-danger">{item}</li>)}</ul> : <p className="text-sm text-success">No PSV readiness blockers returned by backend.</p>}</DetailPanel>
      </div>
    </div>
  );
}
