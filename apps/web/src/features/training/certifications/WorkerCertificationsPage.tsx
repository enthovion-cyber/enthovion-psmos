'use client';

import { useQuery } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CertificateExpiryTable } from './CertificateExpiryTable';

export function WorkerCertificationsPage({ workerId }: { workerId: string }) {
  const query = useQuery({ queryKey: ['training', 'worker', workerId, 'certificates'], queryFn: () => certificationService.worker(workerId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <CertificateExpiryTable title="Worker Certifications" rows={query.data?.rows ?? []} />;
}
