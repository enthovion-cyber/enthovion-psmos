import { CriticalAlarmDetailPage } from '@/features/mechanical-integrity/critical-alarms/CriticalAlarmDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityCriticalAlarmDetailPage(props: { params: Promise<{ alarmId: string }> }) {
  const params = await props.params;
  return <CriticalAlarmDetailPage alarmId={params.alarmId} />;
}
