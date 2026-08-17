import { DeviationFormPage } from '@/features/mechanical-integrity/deviations/DeviationFormPage';

export default function MechanicalIntegrityNewDeviationPage({ searchParams }: { searchParams?: { equipmentId?: string } }) {
  return <DeviationFormPage preset={{ equipmentId: searchParams?.equipmentId ?? '' }} />;
}
