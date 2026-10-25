import { MiDashboardPage } from '@/features/mechanical-integrity/dashboard/MiDashboardPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function MechanicalIntegrityPage() {
  return <MiDashboardPage />;
}
