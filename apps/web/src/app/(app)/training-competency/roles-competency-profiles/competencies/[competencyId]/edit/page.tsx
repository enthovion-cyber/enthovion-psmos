import { CompetencyFormPage } from '@/features/training/competency/CompetencyFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ competencyId: string }> }) {
  const params = await props.params;
  return <CompetencyFormPage competencyId={params.competencyId} />;
}
