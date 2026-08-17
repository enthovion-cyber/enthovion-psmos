import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function MissingSafeOperatingLimitsPage() {
  return <SafeOperatingLimitRegistryPage preset={{ missing: 'true' }} />;
}
