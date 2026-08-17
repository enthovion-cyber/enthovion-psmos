import { SafeOperatingLimitFormPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitFormPage';

export default function NewUnitSafeOperatingLimitPage({ params }: { params: { unitId: string } }) {
  return <SafeOperatingLimitFormPage unitId={params.unitId} />;
}
