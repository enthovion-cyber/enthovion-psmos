import type { PermitDashboard } from '@/services/ptw.service';
import { ConflictPanel } from './ConflictPanel';
import { ExpiringPermitsPanel } from './ExpiringPermitsPanel';
import { GasRetestPanel } from './GasRetestPanel';
import { HandoverPanel } from './HandoverPanel';
import { IsolationPanel } from './IsolationPanel';
import { SafetyCriticalPanel } from './SafetyCriticalPanel';

export function ControlRoomPanels({ panels }: { panels?: PermitDashboard['panels'] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      <ExpiringPermitsPanel data={panels?.expiring} />
      <GasRetestPanel data={panels?.gasRetest} />
      <ConflictPanel data={panels?.conflicts} />
      <IsolationPanel data={panels?.isolation} />
      <HandoverPanel data={panels?.handover} />
      <SafetyCriticalPanel data={panels?.safetyCritical} />
    </div>
  );
}
