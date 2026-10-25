import { PsmScopeDetail } from '@/features/executive/psm-elements/PsmElementAdministration';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  return <PsmScopeDetail type="unit" scopeId={unitId} />;
}
