import { SummaryGrid } from './SafeguardUiPrimitives';

export function SafeguardSummaryCards({ summary }: { summary?: Record<string, any> }) {
  return (
    <SummaryGrid cards={[
      ['Total safeguards', summary?.totalSafeguards ?? summary?.total],
      ['SIFs', summary?.totalSifs],
      ['Interlocks', summary?.totalInterlocks],
      ['Critical alarms', summary?.totalCriticalAlarms],
      ['Due next 30 days', summary?.dueNext30Days],
      ['Overdue', summary?.overdue],
      ['Failed tests', summary?.failedTests],
      ['Active bypasses', summary?.activeBypasses],
      ['LOPA/SIL linked', summary?.lopaSilLinked],
      ['PSSR blockers', summary?.pssrBlockers],
      ['Startup blocked', summary?.startupBlocked],
      ['Readiness blocked', summary?.readinessBlocked]
    ]} />
  );
}
