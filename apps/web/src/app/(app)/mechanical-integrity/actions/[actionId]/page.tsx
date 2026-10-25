import { WorkOrderDetailPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityActionDetailPage(props: { params: Promise<{ actionId: string }> }) {
  const params = await props.params;
  return <WorkOrderDetailPage workOrderId={params.actionId} />;
}
