import { SopAckScopedAssignmentsPage } from '@/features/training/sop-ack/SopAckScopedAssignmentsPage';

export default function Page({ params }: { params: { unitId: string } }) {
  return <SopAckScopedAssignmentsPage scope="units" id={params.unitId} title="Unit SOP Acknowledgements" />;
}
