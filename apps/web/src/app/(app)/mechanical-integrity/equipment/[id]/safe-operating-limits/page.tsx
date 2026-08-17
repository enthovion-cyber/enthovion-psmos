import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function MiEquipmentSafeOperatingLimitsPage({ params }: { params: { id: string } }) {
  return <SafeOperatingLimitRegistryPage equipmentId={params.id} />;
}
