import { ReadinessContent, TabPanel } from '../shared/IncidentTabPrimitives';

export function SeverityReadinessPanel({ readiness }: { readiness: any }) {
  return (
    <TabPanel title="Severity Readiness / Missing Data">
      <ReadinessContent readiness={readiness} />
    </TabPanel>
  );
}
