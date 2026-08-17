import { SafeOperatingLimitFormPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitFormPage';

export default function EditSafeOperatingLimitPage({ params }: { params: { limitId: string } }) {
  return <SafeOperatingLimitFormPage limitId={params.limitId} />;
}
