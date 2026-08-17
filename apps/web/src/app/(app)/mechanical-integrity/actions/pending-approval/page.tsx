import { MiActionsPage } from '@/features/mechanical-integrity/actions/MiActionsPage';

export default function MechanicalIntegrityPendingApprovalActionsPage() {
  return <MiActionsPage initialFilters={{ status: 'Waiting Approval' }} />;
}
