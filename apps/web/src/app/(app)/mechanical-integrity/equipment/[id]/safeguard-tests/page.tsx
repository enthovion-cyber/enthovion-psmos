import { SafeguardTestRegistryPage } from '@/features/mechanical-integrity/safeguard-tests/SafeguardTestRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EquipmentSafeguardTestsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <SafeguardTestRegistryPage equipmentId={params.id} />;
}
