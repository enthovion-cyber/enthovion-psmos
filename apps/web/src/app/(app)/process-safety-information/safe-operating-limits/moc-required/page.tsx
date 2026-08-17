import { SafeOperatingLimitRegistryPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitRegistryPage';

export default function MocRequiredSafeOperatingLimitsPage() {
  return <SafeOperatingLimitRegistryPage preset={{ mocRequired: 'true' }} />;
}
