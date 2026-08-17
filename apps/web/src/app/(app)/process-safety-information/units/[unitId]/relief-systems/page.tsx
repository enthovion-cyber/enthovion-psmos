import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function UnitReliefSystemsPage({ params }: { params: { unitId: string } }) {
  return <ReliefSystemRegistryPage unitId={params.unitId} />;
}
