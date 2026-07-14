import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';

export function EventDetailsReadinessPanel({ readiness }: { readiness: any }) {
  return (
    <TabPanel title="Event Details Readiness / Missing Data">
      <ReadinessContent readiness={readiness} />
    </TabPanel>
  );
}
