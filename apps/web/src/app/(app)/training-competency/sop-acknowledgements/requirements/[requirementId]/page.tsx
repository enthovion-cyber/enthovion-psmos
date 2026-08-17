import { SopAckRequirementDetailPage } from '@/features/training/sop-ack/SopAckRequirementDetailPage';

export default function Page({ params }: { params: { requirementId: string } }) {
  return <SopAckRequirementDetailPage requirementId={params.requirementId} />;
}
