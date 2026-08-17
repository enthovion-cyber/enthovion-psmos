import { TrainingMatrixGridPage } from '@/features/training/matrix/TrainingMatrixGridPage';

export default function Page({ params }: { params: { areaId: string } }) {
  return <TrainingMatrixGridPage scope={{ areaId: params.areaId }} />;
}
