import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function ConflictingSafeOperatingLimitsPage() {
  return <SafeOperatingLimitRegistryPage preset={{ conflicts: 'true' }} />;
}
