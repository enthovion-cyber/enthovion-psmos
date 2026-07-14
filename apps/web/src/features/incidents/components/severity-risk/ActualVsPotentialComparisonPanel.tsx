import { SeverityCompare, TabPanel } from '../shared/IncidentTabPrimitives';

export function ActualVsPotentialComparisonPanel({ comparison }: { comparison: any }) {
  return (
    <TabPanel title="Actual vs Potential Severity Comparison">
      <SeverityCompare actual={comparison?.actualRank ?? 0} potential={comparison?.potentialRank ?? 0} />
      {comparison?.nearMissWarning ? <div className="mt-3 rounded-lg border border-red-400/25 bg-red-500/10 p-2 text-xs text-red-700 dark:text-red-200">Near miss has higher potential severity than actual outcome. Potential severity drives priority.</div> : null}
    </TabPanel>
  );
}
