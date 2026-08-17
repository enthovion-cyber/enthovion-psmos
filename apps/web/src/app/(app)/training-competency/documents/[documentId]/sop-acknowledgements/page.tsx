import { SopAckDocumentAssignmentsPage } from '@/features/training/sop-ack/SopAckDocumentAssignmentsPage';

export default function Page({ params }: { params: { documentId: string } }) {
  return <SopAckDocumentAssignmentsPage type="document" id={params.documentId} />;
}
