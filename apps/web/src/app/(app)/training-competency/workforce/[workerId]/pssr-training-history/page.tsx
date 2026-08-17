import { PssrTrainingWorkerPage } from '@/features/training/pssr/PssrTrainingWorkerPage';
export default function Page({ params }: { params: { workerId: string } }) { return <PssrTrainingWorkerPage workerId={params.workerId} view="history" />; }
