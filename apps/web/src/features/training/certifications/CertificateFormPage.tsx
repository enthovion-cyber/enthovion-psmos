'use client';

import { useRouter } from 'next/navigation';
import { useCertificateDetail } from '../hooks/useCertificateDetail';
import { useCertificateMutations } from '../hooks/useCertificateMutations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CertificateForm } from './CertificateForm';

export function CertificateFormPage({ certificateId }: { certificateId?: string }) {
  const router = useRouter();
  const detail = useCertificateDetail(certificateId ?? '');
  const mutations = useCertificateMutations(certificateId);
  if (certificateId && detail.isLoading) return <TrainingLoadingState rows={4} />;
  if (certificateId && detail.isError) return <TrainingErrorState message={detail.error} onRetry={() => detail.refetch()} />;
  const save = async (values: Record<string, unknown>) => {
    if (certificateId) await mutations.update.mutateAsync(values);
    else {
      const row = await mutations.create.mutateAsync(values);
      router.push(`/training-competency/certifications/${row.id}`);
    }
  };
  return <CertificateForm initial={detail.data?.certificate} onSubmit={save} saving={mutations.create.isPending || mutations.update.isPending} />;
}
