import { IncidentDetailPage } from '@/features/incidents/components/detail/IncidentDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function IncidentDetailRoute(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <IncidentDetailPage id={params.id} />;
}
