import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityNewReliefTestWorkOrderPage(props: { params: Promise<{ testId: string }> }) {
  const params = await props.params;
  return <WorkOrderFormPage preset={{ sourceModule: 'Relief Device Test', sourceRecordId: params.testId }} />;
}
