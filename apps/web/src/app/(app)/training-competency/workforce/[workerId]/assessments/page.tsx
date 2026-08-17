import { WorkerAssessmentsPage } from '@/features/training/assessments/WorkerAssessmentsPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <WorkerAssessmentsPage workerId={params.workerId} />;
}
