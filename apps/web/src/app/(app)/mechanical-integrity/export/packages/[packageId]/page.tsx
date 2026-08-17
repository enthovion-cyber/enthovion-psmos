import { ExportPackageDetailPage } from '@/features/mechanical-integrity/export/ExportPackageDetailPage';

export default function Page({ params }: { params: { packageId: string } }) {
  return <ExportPackageDetailPage packageId={params.packageId} />;
}
