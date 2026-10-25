import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityPmWorkOrdersPage(props: { params: Promise<{ pmRecordId: string }> }) {
  const params = await props.params;
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Preventive Maintenance', sourceRecordId: params.pmRecordId }} />;
}
