import { ImpairmentDetailPage } from '@/features/mechanical-integrity/impairments/ImpairmentDetailPage';

export default function RestoreBypassImpairmentPage({ params }: { params: { impairmentId: string } }) {
  return <ImpairmentDetailPage impairmentId={params.impairmentId} />;
}
