import { PermitDetailPage as PermitDetailWorkbench } from '@/features/ptw/components/PermitDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function PermitDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <PermitDetailWorkbench id={params.id} />;
}
