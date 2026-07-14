import { useIncidentOverview } from '../../hooks/useIncidentOverview';
import type { IncidentOverview } from '../../types/incident-overview.types';
import { AssetEquipmentChemicalSnapshotPanel } from './AssetEquipmentChemicalSnapshotPanel';
import { CorrectiveActionSnapshotPanel } from './CorrectiveActionSnapshotPanel';
import { EventSnapshotPanel } from './EventSnapshotPanel';
import { EvidenceSnapshotPanel } from './EvidenceSnapshotPanel';
import { ImmediateActionsSnapshotPanel } from './ImmediateActionsSnapshotPanel';
import { InvestigationReadinessPanel } from './InvestigationReadinessPanel';
import { LessonsLearnedSnapshotPanel } from './LessonsLearnedSnapshotPanel';
import { LinkedPsmRecordsSnapshotPanel } from './LinkedPsmRecordsSnapshotPanel';
import { OpenBlockersNextStepsPanel } from './OpenBlockersNextStepsPanel';
import { OverviewChartsPanel } from './OverviewChartsPanel';
import { OverviewEmptyState } from './OverviewEmptyState';
import { OverviewErrorState } from './OverviewErrorState';
import { OverviewHeader } from './OverviewHeader';
import { OverviewInfographicsPanel } from './OverviewInfographicsPanel';
import { OverviewLoadingState } from './OverviewLoadingState';
import { OverviewPermissionState } from './OverviewPermissionState';
import { OverviewRestrictedState } from './OverviewRestrictedState';
import { OverviewSummaryCards } from './OverviewSummaryCards';
import { PeopleInjuryExposureSnapshotPanel } from './PeopleInjuryExposureSnapshotPanel';
import { PsmProcessSafetyPanel } from './PsmProcessSafetyPanel';
import { QuickLinksNavigationPanel } from './QuickLinksNavigationPanel';
import { RcaBarrierSnapshotPanel } from './RcaBarrierSnapshotPanel';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { RegulatoryNotificationSnapshotPanel } from './RegulatoryNotificationSnapshotPanel';
import { SeverityRiskPotentialPanel } from './SeverityRiskPotentialPanel';

export function IncidentOverviewTab({ incidentId, overview: initialOverview, actions = [] }: { incidentId?: string; overview?: IncidentOverview; actions?: any[] }) {
  const query = useIncidentOverview(incidentId, initialOverview);
  const overview = query.data;

  if (query.isLoading) return <OverviewLoadingState />;
  if ((query.error as any)?.response?.status === 403) return <OverviewPermissionState />;
  if (query.error) return <OverviewErrorState error={query.error} />;
  if (!overview) return <OverviewEmptyState message="No incident overview data was returned by the backend." />;
  if (overview.restricted) return <OverviewRestrictedState snapshot={overview.eventSnapshot} />;

  return (
    <div className="grid gap-4">
      <OverviewHeader header={overview.header} actions={actions.length ? actions : overview.header?.actions} />
      <OverviewSummaryCards cards={overview.summaryCards} />
      <OverviewChartsPanel charts={overview.charts} />
      <OverviewInfographicsPanel
        charts={overview.charts}
        psm={overview.psmClassification}
        evidence={overview.evidenceSnapshot}
        linkedRecords={overview.linkedPsmRecordsSnapshot}
        blockers={overview.blockersNextSteps}
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <EventSnapshotPanel data={overview.eventSnapshot} />
        <SeverityRiskPotentialPanel data={overview.severityRisk} />
        <PsmProcessSafetyPanel data={overview.psmClassification} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <InvestigationReadinessPanel readiness={overview.investigationReadiness} />
        <OpenBlockersNextStepsPanel data={overview.blockersNextSteps} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <PeopleInjuryExposureSnapshotPanel data={overview.peopleSnapshot} />
        <AssetEquipmentChemicalSnapshotPanel data={overview.assetChemicalSnapshot} />
        <ImmediateActionsSnapshotPanel data={overview.immediateActionsSnapshot} />
        <RcaBarrierSnapshotPanel data={overview.rcaBarrierSnapshot} />
        <CorrectiveActionSnapshotPanel data={overview.capaSnapshot} />
        <LinkedPsmRecordsSnapshotPanel data={overview.linkedPsmRecordsSnapshot} />
        <EvidenceSnapshotPanel data={overview.evidenceSnapshot} />
        <RegulatoryNotificationSnapshotPanel data={overview.regulatoryNotificationSnapshot} />
        <LessonsLearnedSnapshotPanel data={overview.lessonsLearnedSnapshot} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <RecentActivityTimeline items={overview.recentActivity} />
        <QuickLinksNavigationPanel links={overview.quickLinks} />
      </div>
    </div>
  );
}
