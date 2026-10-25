import { WorkOrderFormPage } from '@/features/mechanical-integrity/work-orders/WorkOrderFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityNewWorkOrderPage(
  props: { searchParams?: Promise<{ equipmentId?: string; sourceModule?: string; sourceRecordId?: string; linkedDeficiencyId?: string }> }
) {
  const searchParams = await props.searchParams;
  return <WorkOrderFormPage preset={searchParams ?? {}} />;
}
