import { ReliefSystemDetailPage } from '@/features/psi/relief-systems/ReliefSystemDetailPage';

export default function UnitReliefSystemDetailPage({ params }: { params: { reliefBasisId: string } }) {
  return <ReliefSystemDetailPage reliefBasisId={params.reliefBasisId} />;
}
