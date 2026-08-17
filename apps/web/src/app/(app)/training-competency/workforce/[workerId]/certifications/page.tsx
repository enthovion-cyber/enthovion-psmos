import { WorkerCertificationsPage } from '@/features/training/certifications/WorkerCertificationsPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <WorkerCertificationsPage workerId={params.workerId} />;
}
