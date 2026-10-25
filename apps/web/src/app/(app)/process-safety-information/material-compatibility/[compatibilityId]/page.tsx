import { MaterialCompatibilityDetailPage } from '@/features/psi/material-compatibility/MaterialCompatibilityDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MaterialCompatibilityDetailRoute(props: { params: Promise<{ compatibilityId: string }> }) {
  const params = await props.params;
  return <MaterialCompatibilityDetailPage compatibilityId={params.compatibilityId} />;
}

