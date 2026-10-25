import { UtReadingsPage } from '@/features/mechanical-integrity/ut-readings/UtReadingsPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function NewCmlUtReadingPage(props: { params: Promise<{ id: string; cmlId: string }> }) {
  const params = await props.params;
  return <UtReadingsPage equipmentId={params.id} cmlId={params.cmlId} />;
}
