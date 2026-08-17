import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function CriticalSafeOperatingLimitsPage() {
  return <SafeOperatingLimitRegistryPage preset={{ critical: 'true' }} />;
}
