import { ReliefCertificatesSection } from '../sections/ReliefCertificatesSection';

export function ReliefDeviceCertificatesTab({ certificates }: { certificates?: Record<string, unknown>[] | undefined }) {
  return <ReliefCertificatesSection certificates={certificates} />;
}
