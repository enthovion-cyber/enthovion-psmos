import { MocTrainingWorkerPage } from '@/features/training/moc/MocTrainingWorkerPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <MocTrainingWorkerPage workerId={params.workerId} view="requirements" />;
}
