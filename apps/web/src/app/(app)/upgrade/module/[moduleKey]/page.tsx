import { UpgradeRequiredPage } from '@/features/billing/UpgradeRequiredPage';

export default function Page({ params }: { params: { moduleKey: string } }) {
  return <UpgradeRequiredPage kind="module" value={params.moduleKey} />;
}
