import { CertificateFormPage } from '@/features/training/certifications/CertificateFormPage';

export default function Page({ params }: { params: { certificateId: string } }) {
  return <CertificateFormPage certificateId={params.certificateId} />;
}
