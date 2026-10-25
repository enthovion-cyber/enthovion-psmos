import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EquipmentReliefSystemsPage(props: { params: Promise<{ equipmentId: string }> }) {
  const params = await props.params;
  return <ReliefSystemRegistryPage equipmentId={params.equipmentId} />;
}
