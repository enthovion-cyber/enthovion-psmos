import { ReliefSystemDetailPage } from '@/features/psi/relief-systems/ReliefSystemDetailPage';

export default function ReliefSystemDetailRoute({ params }: { params: { reliefBasisId: string } }) {
  return <ReliefSystemDetailPage reliefBasisId={params.reliefBasisId} />;
}
