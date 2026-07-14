import { Badge } from '../shared/IncidentStatusBadge';
import { OverviewPanelShell, SnapshotGrid } from './OverviewPanelShell';
export function RegulatoryNotificationSnapshotPanel({ data }: { data?: Record<string, any> }) {
  return <OverviewPanelShell title="Regulatory / Notification Snapshot Panel" subtitle="Regulatory reporting, PSM review, and notification requirement state."><div className="mb-3 flex flex-wrap gap-2"><Badge value={data?.status}/><Badge value={data?.pseTier}/></div><SnapshotGrid data={data} fields={[['regulatoryReportingRequired','Regulatory reporting required'],['notificationRequired','Notification required'],['psmReviewRequired','PSM review required'],['thresholdExceeded','Threshold exceeded'],['reviewerRequired','Reviewer required']]} /></OverviewPanelShell>;
}
