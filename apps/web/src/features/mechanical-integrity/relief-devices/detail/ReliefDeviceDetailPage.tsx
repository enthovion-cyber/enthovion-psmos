'use client';

import { useState } from 'react';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { useReliefDeviceDetail } from '../../hooks/useReliefDeviceDetail';
import { ReliefDeviceDetailHeader } from './ReliefDeviceDetailHeader';
import { ReliefDeviceBasisTab } from './ReliefDeviceBasisTab';
import { ReliefDeviceCertificatesTab } from './ReliefDeviceCertificatesTab';
import { ReliefDeviceHistoryTab } from './ReliefDeviceHistoryTab';
import { ReliefDeviceOverviewTab } from './ReliefDeviceOverviewTab';
import { ReliefDeviceProtectedEquipmentTab } from './ReliefDeviceProtectedEquipmentTab';
import { ReliefDeviceSealLockTab } from './ReliefDeviceSealLockTab';
import { ReliefDeviceTechnicalDataTab } from './ReliefDeviceTechnicalDataTab';
import { ReliefDeviceTestRecordsTab } from './ReliefDeviceTestRecordsTab';
import { ReliefDeviceTestScheduleTab } from './ReliefDeviceTestScheduleTab';

const tabs = ['Overview', 'Technical Data', 'Protected Equipment', 'Relief Basis', 'Test Schedule', 'Test Records', 'Certificates', 'Seals / Locks', 'History'];

export function ReliefDeviceDetailPage({ reliefDeviceId }: { reliefDeviceId: string }) {
  const [tab, setTab] = useState(tabs[0]);
  const query = useReliefDeviceDetail(reliefDeviceId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Relief device could not be loaded.</div>;
  const detail = query.data;
  return (
    <div className="space-y-5">
      <ReliefDeviceDetailHeader device={detail.device} />
      <nav className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold ${item === tab ? 'border-info bg-info/10 text-info' : 'border-[var(--psm-line)]'}`}>{item}</button>)}
      </nav>
      {tab === 'Overview' && <ReliefDeviceOverviewTab detail={detail} />}
      {tab === 'Technical Data' && <ReliefDeviceTechnicalDataTab data={detail.technicalData} />}
      {tab === 'Protected Equipment' && <ReliefDeviceProtectedEquipmentTab rows={detail.protectedEquipment} />}
      {tab === 'Relief Basis' && <ReliefDeviceBasisTab data={detail.basis} />}
      {tab === 'Test Schedule' && <ReliefDeviceTestScheduleTab requirement={detail.testRequirement} occurrences={detail.occurrences} />}
      {tab === 'Test Records' && <ReliefDeviceTestRecordsTab rows={detail.tests} />}
      {tab === 'Certificates' && <ReliefDeviceCertificatesTab certificates={detail.certificates} />}
      {tab === 'Seals / Locks' && <ReliefDeviceSealLockTab data={detail.seals} />}
      {tab === 'History' && <ReliefDeviceHistoryTab rows={detail.history} />}
    </div>
  );
}
