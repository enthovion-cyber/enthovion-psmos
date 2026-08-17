import { ImpairmentDetailPage } from '@/features/mechanical-integrity/impairments/ImpairmentDetailPage';

export default function BypassImpairmentDetailPage({ params }: { params: { impairmentId: string } }) {
  return <ImpairmentDetailPage impairmentId={params.impairmentId} />;
}
