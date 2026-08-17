import { TrainingMatrixGridPage } from '@/features/training/matrix/TrainingMatrixGridPage';

export default function Page({ params }: { params: { unitId: string } }) {
  return <TrainingMatrixGridPage scope={{ unitId: params.unitId }} />;
}
