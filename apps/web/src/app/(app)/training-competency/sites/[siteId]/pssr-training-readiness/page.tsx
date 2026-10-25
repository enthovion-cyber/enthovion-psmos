import { PssrTrainingScopedPage } from '@/features/training/pssr/PssrTrainingScopedPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ siteId: string }> }) {
  const params = await props.params;
  return <PssrTrainingScopedPage scope="sites" id={params.siteId} />;
}
