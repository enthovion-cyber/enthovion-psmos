import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function EquipmentSafeOperatingLimitsPage({ params }: { params: { equipmentId: string } }) {
  return <SafeOperatingLimitRegistryPage equipmentId={params.equipmentId} />;
}
