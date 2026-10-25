import { DrawingFormPage } from '@/features/psi/drawings/DrawingFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EditPsiDrawingPage(props: { params: Promise<{ drawingId: string }> }) {
  const params = await props.params;
  return <DrawingFormPage drawingId={params.drawingId} />;
}
