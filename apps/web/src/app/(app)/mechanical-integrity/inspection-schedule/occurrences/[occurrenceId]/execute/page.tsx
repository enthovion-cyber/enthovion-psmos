import { OccurrenceExecutionPage } from '@/features/mechanical-integrity/inspection-records/OccurrenceExecutionPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ExecuteInspectionOccurrencePage(props: { params: Promise<{ occurrenceId: string }> }) {
  const params = await props.params;
  return <OccurrenceExecutionPage occurrenceId={params.occurrenceId} />;
}
