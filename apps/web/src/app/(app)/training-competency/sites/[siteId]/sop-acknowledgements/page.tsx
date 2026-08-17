import { SopAckScopedAssignmentsPage } from '@/features/training/sop-ack/SopAckScopedAssignmentsPage';

export default function Page({ params }: { params: { siteId: string } }) {
  return <SopAckScopedAssignmentsPage scope="sites" id={params.siteId} title="Site SOP Acknowledgements" />;
}
