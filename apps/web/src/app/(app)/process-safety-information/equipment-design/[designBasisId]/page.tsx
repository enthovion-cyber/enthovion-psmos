import { EquipmentDesignDetailPage } from '@/features/psi/equipment-design/EquipmentDesignDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EquipmentDesignBasisDetailRoute(props: { params: Promise<{ designBasisId: string }> }) {
  const params = await props.params;
  return <EquipmentDesignDetailPage designBasisId={params.designBasisId} />;
}
