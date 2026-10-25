import { SafeOperatingLimitDetailPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function SafeOperatingLimitDetailRoute(props: { params: Promise<{ limitId: string }> }) {
  const params = await props.params;
  return <SafeOperatingLimitDetailPage limitId={params.limitId} />;
}
