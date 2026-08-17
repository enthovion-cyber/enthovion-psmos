import { ElectricalClassificationDetailPage } from '@/features/psi/electrical-classification/ElectricalClassificationDetailPage';

export default function UnitElectricalClassificationDetailPage({ params }: { params: { classificationId: string } }) {
  return <ElectricalClassificationDetailPage classificationId={params.classificationId} />;
}
