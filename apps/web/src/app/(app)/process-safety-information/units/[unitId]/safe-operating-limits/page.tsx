import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function UnitSafeOperatingLimitsPage({ params }: { params: { unitId: string } }) {
  return <SafeOperatingLimitRegistryPage unitId={params.unitId} />;
}
