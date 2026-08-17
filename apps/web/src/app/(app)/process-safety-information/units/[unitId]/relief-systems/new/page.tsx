import { ReliefSystemFormPage } from '@/features/psi/relief-systems/ReliefSystemFormPage';

export default function NewUnitReliefSystemPage({ params }: { params: { unitId: string } }) {
  return <ReliefSystemFormPage forcedUnitId={params.unitId} />;
}
