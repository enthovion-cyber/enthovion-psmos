import type { MiImpairmentSummary } from '../types/impairment.types';
import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';

export function ImpairmentSummaryCards({ summary }: { summary?: MiImpairmentSummary | null | undefined }) {
  return (
    <SummaryGrid cards={[
      ['Total records', summary?.totalRecords ?? 0],
      ['Active bypasses', summary?.activeBypasses ?? 0],
      ['Active impairments', summary?.activeImpairments ?? 0],
      ['Active overrides', summary?.activeOverrides ?? 0],
      ['Active inhibits', summary?.activeInhibits ?? 0],
      ['Expired bypasses', summary?.expiredBypasses ?? 0],
      ['Pending approval', summary?.pendingApproval ?? 0],
      ['Pending restoration verification', summary?.pendingRestorationVerification ?? 0],
      ['Critical safeguards impaired', summary?.criticalSafeguardsImpaired ?? 0],
      ['LOPA / SIL IPLs impaired', summary?.lopaSilIplsImpaired ?? 0],
      ['PSV / relief devices impaired', summary?.psvReliefDevicesImpaired ?? 0],
      ['SIFs impaired', summary?.sifsImpaired ?? 0],
      ['Interlocks impaired', summary?.interlocksImpaired ?? 0],
      ['Critical alarms impaired', summary?.criticalAlarmsImpaired ?? 0],
      ['Startup blocked', summary?.startupBlocked ?? 0],
      ['MOC required / suggested', summary?.mocRequiredSuggested ?? 0],
      ['PTW / LOTO linked', summary?.ptwLotoLinked ?? 0],
      ['Restored this month', summary?.restoredThisMonth ?? 0]
    ]} />
  );
}
