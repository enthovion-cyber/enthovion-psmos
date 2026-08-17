import { SafeOperatingLimitDetailPage } from '@/features/psi/safe-operating-limits/SafeOperatingLimitDetailPage';

export default function SafeOperatingLimitDetailRoute({ params }: { params: { limitId: string } }) {
  return <SafeOperatingLimitDetailPage limitId={params.limitId} />;
}
