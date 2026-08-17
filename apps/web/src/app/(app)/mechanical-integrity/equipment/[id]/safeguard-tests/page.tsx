import { SafeguardTestRegistryPage } from '@/features/mechanical-integrity/safeguard-tests/SafeguardTestRegistryPage';

export default function EquipmentSafeguardTestsPage({ params }: { params: { id: string } }) {
  return <SafeguardTestRegistryPage equipmentId={params.id} />;
}
