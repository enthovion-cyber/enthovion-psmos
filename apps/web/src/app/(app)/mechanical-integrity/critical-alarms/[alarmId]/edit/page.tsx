import { CriticalAlarmFormPage } from '@/features/mechanical-integrity/critical-alarms/CriticalAlarmFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityEditCriticalAlarmPage(props: { params: Promise<{ alarmId: string }> }) {
  const params = await props.params;
  return <CriticalAlarmFormPage alarmId={params.alarmId} />;
}
