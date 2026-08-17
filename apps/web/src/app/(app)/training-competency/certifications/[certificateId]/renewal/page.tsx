import { CertificateDetailPage } from '@/features/training/certifications/CertificateDetailPage';

export default function Page({ params }: { params: { certificateId: string } }) {
  return <CertificateDetailPage certificateId={params.certificateId} />;
}
