import { WorkerFormPage } from '@/features/training/workforce/WorkerFormPage';
export default function Page({ params }: { params: { workerId: string } }) { return <WorkerFormPage workerId={params.workerId} />; }
