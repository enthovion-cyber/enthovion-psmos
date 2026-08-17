import { RequiredTrainingCertificatesPage } from '@/features/training/certifications/RequiredTrainingCertificatesPage';

export default function Page({ params }: { params: { trainingId: string } }) {
  return <RequiredTrainingCertificatesPage trainingId={params.trainingId} />;
}
