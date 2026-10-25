import { CriticalAlarmRegistryPage } from '@/features/mechanical-integrity/critical-alarms/CriticalAlarmRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function MechanicalIntegrityCriticalAlarmsPage() {
  return <CriticalAlarmRegistryPage />;
}
