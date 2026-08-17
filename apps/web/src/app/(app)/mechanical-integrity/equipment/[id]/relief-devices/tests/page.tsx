import { ReliefTestRegistryPage } from '@/features/mechanical-integrity/relief-tests/ReliefTestRegistryPage';

export default function Page({ params }: { params: { id: string } }) {
  return <ReliefTestRegistryPage equipmentId={params.id} />;
}
