'use client';

import { useQuery } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CertificateExpiryTable } from './CertificateExpiryTable';

export function RequiredTrainingCertificatesPage({ trainingId }: { trainingId: string }) {
  const query = useQuery({ queryKey: ['training', 'required', trainingId, 'certificates'], queryFn: () => certificationService.requiredTraining(trainingId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <CertificateExpiryTable title="Required Training Certificates" rows={query.data?.rows ?? []} />;
}
