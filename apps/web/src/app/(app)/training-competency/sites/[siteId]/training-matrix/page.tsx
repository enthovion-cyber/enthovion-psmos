import { TrainingMatrixGridPage } from '@/features/training/matrix/TrainingMatrixGridPage';

export default function Page({ params }: { params: { siteId: string } }) {
  return <TrainingMatrixGridPage scope={{ siteId: params.siteId }} />;
}
