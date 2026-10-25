import { InspectionRecordRegistryPage } from '@/features/mechanical-integrity/inspection-records/InspectionRecordRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EquipmentInspectionRecordsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <InspectionRecordRegistryPage equipmentId={params.id} />;
}
