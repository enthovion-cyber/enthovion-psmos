import { SopAckDocumentAssignmentsPage } from '@/features/training/sop-ack/SopAckDocumentAssignmentsPage';

export default function Page({ params }: { params: { sopId: string } }) {
  return <SopAckDocumentAssignmentsPage type="sop" id={params.sopId} />;
}
