import type { LopaOverview } from '../../types/lopa-overview.types';
import { LopaCalculationSnapshot } from '../overview/LopaCalculationSnapshot';
import { LopaConsequenceSnapshotPanel } from '../overview/LopaConsequenceSnapshotPanel';
import { LopaInitiatingEventSnapshotPanel } from '../overview/LopaInitiatingEventSnapshotPanel';
import { LopaLinkedHazopSnapshot } from '../overview/LopaLinkedHazopSnapshot';
import { LopaLinkedRecordsPreview } from '../overview/LopaLinkedRecordsPreview';
import { LopaOpenActionsBlockersPanel } from '../overview/LopaOpenActionsBlockersPanel';
import { LopaOverviewSummaryCards } from '../overview/LopaOverviewSummaryCards';
import { LopaQuickActionsPanel } from '../overview/LopaQuickActionsPanel';
import { LopaReadinessPanel } from '../overview/LopaReadinessPanel';
import { LopaRecentActivityTimeline } from '../overview/LopaRecentActivityTimeline';
import { LopaSafeguardIplSnapshot } from '../overview/LopaSafeguardIplSnapshot';
import { LopaSilRequirementSnapshot } from '../overview/LopaSilRequirementSnapshot';
import { LopaStudyMetadataPanel } from '../overview/LopaStudyMetadataPanel';

export function LopaOverviewTab({ overview, onSyncHazop, isSyncing, onSelectTab }: { overview: LopaOverview; onSyncHazop: () => void; isSyncing?: boolean; onSelectTab?: (tab?: string) => void }) {
  return (
    <div className="space-y-4">
      <LopaOverviewSummaryCards cards={overview.summaryCards} onSelect={onSelectTab} />
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.1fr_1fr_.72fr]">
        <div className="space-y-4">
          <LopaLinkedHazopSnapshot snapshot={overview.sourceSnapshot} canSync={overview.permissions.canSyncHazop} onSync={onSyncHazop} isSyncing={isSyncing} />
          <LopaSafeguardIplSnapshot safeguards={overview.safeguards} />
          <LopaReadinessPanel readiness={overview.readiness} />
        </div>
        <div className="space-y-4">
          <LopaStudyMetadataPanel metadata={overview.metadata} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-1">
            <LopaConsequenceSnapshotPanel consequence={overview.consequence} />
            <LopaInitiatingEventSnapshotPanel event={overview.initiatingEvent} />
          </div>
          <LopaCalculationSnapshot calculation={overview.calculation} />
          <LopaSilRequirementSnapshot sil={overview.sil} />
        </div>
        <div className="space-y-4">
          <LopaQuickActionsPanel actions={overview.quickActions} onAction={(action) => onSelectTab?.(action.tab)} />
          <LopaOpenActionsBlockersPanel actions={overview.actions} blockers={overview.blockers} />
          <LopaLinkedRecordsPreview records={overview.linkedRecords} />
          <LopaRecentActivityTimeline events={overview.recentActivity} />
        </div>
      </div>
    </div>
  );
}
