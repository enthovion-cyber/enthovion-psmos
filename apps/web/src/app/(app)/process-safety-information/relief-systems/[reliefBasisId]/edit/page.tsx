import { ReliefSystemFormPage } from '@/features/psi/relief-systems/ReliefSystemFormPage';

export default function EditReliefSystemRoute({ params }: { params: { reliefBasisId: string } }) {
  return <ReliefSystemFormPage reliefBasisId={params.reliefBasisId} />;
}
