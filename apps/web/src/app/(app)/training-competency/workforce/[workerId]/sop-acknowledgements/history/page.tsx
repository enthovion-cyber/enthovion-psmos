import { WorkerSopAcknowledgementsPage } from '@/features/training/sop-ack/WorkerSopAcknowledgementsPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <WorkerSopAcknowledgementsPage workerId={params.workerId} view="history" />;
}
