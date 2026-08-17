import { SopAckScopedAssignmentsPage } from '@/features/training/sop-ack/SopAckScopedAssignmentsPage';

export default function Page({ params }: { params: { areaId: string } }) {
  return <SopAckScopedAssignmentsPage scope="areas" id={params.areaId} title="Area SOP Acknowledgements" />;
}
