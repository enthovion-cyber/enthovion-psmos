import { ElectricalClassificationFormPage } from '@/features/psi/electrical-classification/ElectricalClassificationFormPage';

export default function NewUnitElectricalClassificationPage({ params }: { params: { unitId: string } }) {
  return <ElectricalClassificationFormPage unitId={params.unitId} />;
}
