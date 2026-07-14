import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';

export function ReviewApprovalReadinessPanel({ readiness }: { readiness: any }) {
  return (
    <TabPanel title="Review Approval Readiness">
      <ReadinessContent readiness={readiness} />
    </TabPanel>
  );
}
