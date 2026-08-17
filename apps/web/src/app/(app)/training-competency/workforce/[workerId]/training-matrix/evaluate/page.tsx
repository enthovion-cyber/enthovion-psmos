import { WorkerMatrixPage } from '@/features/training/matrix/WorkerMatrixPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <WorkerMatrixPage workerId={params.workerId} />;
}
