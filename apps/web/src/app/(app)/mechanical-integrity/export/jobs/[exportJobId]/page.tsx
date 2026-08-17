import { ExportJobDetailPage } from '@/features/mechanical-integrity/export/ExportJobDetailPage';

export default function Page({ params }: { params: { exportJobId: string } }) {
  return <ExportJobDetailPage jobId={params.exportJobId} />;
}
