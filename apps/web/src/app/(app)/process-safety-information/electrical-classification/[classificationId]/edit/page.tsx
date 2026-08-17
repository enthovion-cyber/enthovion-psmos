import { ElectricalClassificationFormPage } from '@/features/psi/electrical-classification/ElectricalClassificationFormPage';

export default function EditElectricalClassificationRoute({ params }: { params: { classificationId: string } }) {
  return <ElectricalClassificationFormPage classificationId={params.classificationId} />;
}
