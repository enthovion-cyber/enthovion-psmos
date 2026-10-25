import { ProcessChemistryFormPage } from '@/features/psi/process-chemistry/ProcessChemistryFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EditProcessChemistryRoute(props: { params: Promise<{ chemistryId: string }> }) {
  const params = await props.params;
  return <ProcessChemistryFormPage chemistryId={params.chemistryId} />;
}
