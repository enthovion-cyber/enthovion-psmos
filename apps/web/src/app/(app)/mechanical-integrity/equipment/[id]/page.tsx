import { EquipmentDetailPage } from '@/features/mechanical-integrity/equipment-detail/EquipmentDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityEquipmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <EquipmentDetailPage id={params.id} />;
}
