import { WorkerDetailPage } from '@/features/training/workforce/WorkerDetailPage';
export default function Page({ params }: { params: { workerId: string } }) { return <WorkerDetailPage workerId={params.workerId} tab="documents" />; }
