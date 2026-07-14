import { UpgradeRequiredPage } from '@/features/billing/UpgradeRequiredPage';

export default function Page({ params }: { params: { limitKey: string } }) {
  return <UpgradeRequiredPage kind="limit" value={params.limitKey} />;
}
