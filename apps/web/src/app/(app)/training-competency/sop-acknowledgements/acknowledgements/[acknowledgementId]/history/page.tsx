import { SopAcknowledgementDetailPage } from '@/features/training/sop-ack/SopAcknowledgementDetailPage';

export default function Page({ params }: { params: { acknowledgementId: string } }) {
  return <SopAcknowledgementDetailPage acknowledgementId={params.acknowledgementId} />;
}
