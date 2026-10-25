import { PsiChemicalFormPage } from '@/features/psi/chemicals/PsiChemicalFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function NewUnitChemicalPage(props: { params: Promise<{ unitId: string }> }) {
  const params = await props.params;
  return <PsiChemicalFormPage unitId={params.unitId} />;
}
