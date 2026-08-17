import { ImpairmentDetailPage } from '@/features/mechanical-integrity/impairments/ImpairmentDetailPage';

export default function ReviewBypassImpairmentPage({ params }: { params: { impairmentId: string } }) {
  return <ImpairmentDetailPage impairmentId={params.impairmentId} />;
}
