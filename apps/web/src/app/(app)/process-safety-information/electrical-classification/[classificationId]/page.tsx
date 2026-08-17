import { ElectricalClassificationDetailPage } from '@/features/psi/electrical-classification/ElectricalClassificationDetailPage';

export default function ElectricalClassificationDetailRoute({ params }: { params: { classificationId: string } }) {
  return <ElectricalClassificationDetailPage classificationId={params.classificationId} />;
}
