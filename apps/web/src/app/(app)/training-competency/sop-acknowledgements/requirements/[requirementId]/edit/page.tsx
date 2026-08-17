import { SopAckRequirementFormPage } from '@/features/training/sop-ack/SopAckRequirementFormPage';

export default function Page({ params }: { params: { requirementId: string } }) {
  return <SopAckRequirementFormPage requirementId={params.requirementId} />;
}
