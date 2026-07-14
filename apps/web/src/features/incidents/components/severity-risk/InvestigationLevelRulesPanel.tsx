import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function InvestigationLevelRulesPanel({ data }: { data: any }) {
  return (
    <TabPanel title="Investigation Level Rules Panel">
      <InfoRows rows={[
        ['Source', data?.source],
        ['Configured', data?.configured ? 'Yes' : 'No'],
        ['Rule applied', data?.ruleApplied],
        ['Missing reason', data?.missingReason ?? '-']
      ]} />
    </TabPanel>
  );
}
