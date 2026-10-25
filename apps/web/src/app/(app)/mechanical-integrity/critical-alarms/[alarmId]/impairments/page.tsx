import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function CriticalAlarmImpairmentsPage(props: { params: Promise<{ alarmId: string }> }) {
  const params = await props.params;
  return <ImpairmentDashboardPage initialFilters={{ safeguardType: 'Critical Alarm', safeguardId: params.alarmId }} />;
}
