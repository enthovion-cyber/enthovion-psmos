import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function ReviewOverdueSafeOperatingLimitsPage() {
  return <SafeOperatingLimitRegistryPage preset={{ reviewOverdue: 'true' }} />;
}
