import { TrainingMatrixGapRegisterPage } from '@/features/training/matrix/gaps/TrainingMatrixGapRegisterPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <TrainingMatrixGapRegisterPage defaultFilters={{ workerId: params.workerId }} />;
}
